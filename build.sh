#!/usr/bin/env bash
cd protos/spike
curl -o spike.proto https://raw.githubusercontent.com/meateam/spike-service/master/proto/spike-service/spike.proto
cd ../../
npx grpc_tools_node_protoc --js_out=import_style=commonjs,binary:./protos/spike/generated --grpc_out=./protos/spike/generated -I ./protos ./protos/spike/spike.proto
npx grpc_tools_node_protoc \
        --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
        --ts_out=./protos/spike/generated \
        -I ./protos \
        ./protos/spike/spike.proto