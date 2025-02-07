package otel

import (
	"bytes"
	"compress/gzip"
	"context"
	"fmt"
	model2 "github.com/highlight-run/highlight/backend/public-graph/graph/model"
	"github.com/openlyinc/pointy"
	"net/http"
	"os"
	"strings"
	"testing"

	kafkaqueue "github.com/highlight-run/highlight/backend/kafka-queue"
	"github.com/highlight-run/highlight/backend/private-graph/graph/model"
	public "github.com/highlight-run/highlight/backend/public-graph/graph"
	"github.com/stretchr/testify/assert"
	"go.opentelemetry.io/collector/pdata/ptrace/ptraceotlp"
)

type MockKafkaProducer struct {
	messages []*kafkaqueue.Message
}

func (m *MockKafkaProducer) Stop(_ context.Context) {}

func (m *MockKafkaProducer) Receive(_ context.Context) *kafkaqueue.Message { return nil }

func (m *MockKafkaProducer) Submit(_ context.Context, _ string, messages ...*kafkaqueue.Message) error {
	m.messages = append(m.messages, messages...)
	return nil
}

func (m *MockKafkaProducer) LogStats() {}

type MockResponseWriter struct{}

func (m *MockResponseWriter) Header() http.Header {
	return http.Header{}
}

func (m *MockResponseWriter) Write(bytes []byte) (int, error) {
	return 0, nil
}

func (m *MockResponseWriter) WriteHeader(statusCode int) {}

func TestHandler_HandleLog(t *testing.T) {
	w := &MockResponseWriter{}
	r, _ := http.NewRequest("POST", "", strings.NewReader(""))
	h := Handler{}
	h.HandleLog(w, r)
}

func TestHandler_HandleTrace(t *testing.T) {
	for file, tc := range map[string]struct {
		expectedMessageCounts map[kafkaqueue.PayloadType]int
		expectedLogCounts     map[model.LogSource]int
		expectedErrors        *int
		expectedErrorEvent    *string
	}{
		"./samples/traces.json": {
			expectedMessageCounts: map[kafkaqueue.PayloadType]int{
				kafkaqueue.PushBackendPayload: 1,
				kafkaqueue.PushLogs:           15,  // 4 exceptions, 11 logs
				kafkaqueue.PushTraces:         501, // 512 spans - 11 logs
			},
			expectedLogCounts: map[model.LogSource]int{
				model.LogSourceFrontend: 1,
				model.LogSourceBackend:  14,
			},
		},
		"./samples/nextjs.json": {
			expectedErrorEvent: pointy.String("Error: /api/app-directory-test"),
		},
		"./samples/fs.json": {
			expectedErrors: pointy.Int(0),
		},
	} {
		inputBytes, err := os.ReadFile(file)
		if err != nil {
			t.Fatalf("error reading: %v", err)
		}

		req := ptraceotlp.NewExportRequest()
		if err := req.UnmarshalJSON(inputBytes); err != nil {
			t.Fatal(err)
		}

		body, err := req.MarshalProto()
		if err != nil {
			t.Fatal(err)
		}

		b := bytes.Buffer{}
		gz := gzip.NewWriter(&b)
		if _, err := gz.Write(body); err != nil {
			t.Fatal(err)
		}
		if err := gz.Close(); err != nil {
			t.Fatal(err)
		}

		producer := MockKafkaProducer{}
		w := &MockResponseWriter{}
		r, _ := http.NewRequest("POST", "", bytes.NewReader(b.Bytes()))
		h := Handler{
			resolver: &public.Resolver{
				ProducerQueue: &producer,
				BatchedQueue:  &producer,
				TracesQueue:   &producer,
			},
		}
		h.HandleTrace(w, r)

		var appDirError *model2.BackendErrorObjectInput
		numErrors := 0
		logCountsBySource := map[model.LogSource]int{}
		messageCountsByType := map[kafkaqueue.PayloadType]int{}
		for _, message := range producer.messages {
			messageCountsByType[message.Type]++
			if message.Type == kafkaqueue.PushLogs {
				log := message.PushLogs.LogRow
				logCountsBySource[log.Source]++
			} else if message.Type == kafkaqueue.PushBackendPayload {
				appDirError = message.PushBackendPayload.Errors[0]
				numErrors += len(message.PushBackendPayload.Errors)
			}
		}

		if tc.expectedMessageCounts != nil {
			assert.Equal(t, fmt.Sprintf("%+v", tc.expectedMessageCounts), fmt.Sprintf("%+v", messageCountsByType))
		}

		if tc.expectedErrors != nil {
			assert.Equal(t, *tc.expectedErrors, numErrors)
		}

		if tc.expectedErrorEvent != nil {
			assert.Equal(t, appDirError.Event, *tc.expectedErrorEvent)
			assert.Greater(t, len(appDirError.StackTrace), 100)
		}

		if tc.expectedLogCounts != nil {
			assert.Equal(t, fmt.Sprintf("%+v", tc.expectedLogCounts), fmt.Sprintf("%+v", logCountsBySource))
		}
	}

}
