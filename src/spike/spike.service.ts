import { SpikeError } from '../utils/errors';
import { spikeReqBody, spikeServiceURL } from '../config';

const protoLoader = require('@grpc/proto-loader');
const grpc = require('grpc');

const PROTO_PATH = `${__dirname}/../../proto/spike.proto`;
const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    });
const spike_proto = grpc.loadPackageDefinition(packageDefinition).spike;

/**
 * this class gets a token with scopes for the kartoffel authorization from the spike-service
 */
export default class Spike {
    /**
     * This function gets a token from spike service
     * @returns the token
     */
    public async getToken() :Promise<string> {
        const client = await new spike_proto.Spike(spikeServiceURL, grpc.credentials.createInsecure());

        return new Promise((resolve, reject) => {
            client.GetSpikeToken(spikeReqBody, function (err: Error, response: any) {
                if (err) {
                    throw new SpikeError(`Error contacting spike: ${err}`);
                } else {
                    resolve(response.token);
                }
            });
        });
    }
}
