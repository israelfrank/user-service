import * as request from 'request-promise-native';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { IUser } from './users.interface';
import Spike from '../spike/spike.service';
import { RedisClient } from 'redis';
import { KartoffelError, UserNotFoundError, ApplicationError } from '../utils/errors';

const baseUrl = `${process.env.KARTOFFEL_URL || 'http://localhost:4000'}/api/persons`;

export default class UsersService {
    /**
     * Gets a user by its ID from the provider
     * @param id - the user ID
     */
    private SpikeService: Spike;
    private redis: RedisClient;
    private axiosInstance: AxiosInstance;

    constructor(redis: RedisClient) {
        this.redis = redis;
        this.SpikeService = new Spike(redis);
        this.axiosInstance = axios.create();
        // If authentication is needed, adds an authorization header to the axios instance.
        if (process.env.SPIKE_REQUIRED === 'true') {
            this.addAuthInterceptor(); // async function. but cannot await since its a constructor.
        }
    }

    async getByID(id: string): Promise<IUser> {
        let res: AxiosResponse;
        try {
            res = await this.axiosInstance.get(`${baseUrl}/${id}`);
        } catch (err) {
            if (err.response && err.response.status) {
                const statusCode: number = err.response.status;
                if (statusCode === 404) {
                    throw new UserNotFoundError(`The user with id ${id} is not found`);
                }
                // Unauthorized
                if (statusCode === 401) {
                    throw new ApplicationError(`Request to Kartoffel wasn't authorized: ${err} `);
                }
                throw new KartoffelError(`Error in contacting the user service : ${err.response.data}`);
            } else {
                throw new ApplicationError(`Unknown Error while contacting the user service : ${err}`);
            }
        }
        // Status Code = 2XX / 3XX
        const user:IUser = res.data;
        return user;
    }

    private static async getAll(): Promise<IUser[]> {
        const res = await request(`${baseUrl}`);
        return JSON.parse(res);
    }

    /**
     * Gets a user by one of his mail addresses
     * @param domainUser - a mail address
     */
    public async getByDomainUser(domainUser: string): Promise<IUser> {
        let res: AxiosResponse;
        try {
            res = await this.axiosInstance.get(`${baseUrl}/domainUser/${domainUser}`);
        } catch (err) {
            if (err.response && err.response.status) {
                const statusCode: number = err.response.status;
                if (statusCode === 404) {
                    throw new UserNotFoundError(`The user with mail ${domainUser} is not found`);
                }
                // Unauthorized
                if (statusCode === 401) {
                    throw new ApplicationError(`Request to Kartoffel wasn't authorized: ${err} `);
                }
                throw new KartoffelError(`Error in contacting the user service : ${err.response.data}`);
            } else {
                throw new ApplicationError(`Unknown Error while contacting the user service : ${err}`);
            }
        }
        // Status Code = 2XX / 3XX
        const user:IUser = res.data;
        return user;
    }

    /**
     * Search user suggestions by a partial name. returns a list of users ordered by resemblance score
     * @param partialName - the partial name to search by.
     */
    public async searchByName(partialName: string): Promise<IUser[]> {
        let res: AxiosResponse;
        try {
            res = await this.axiosInstance.get(`${baseUrl}/search`, { params: { fullname: partialName } });
        } catch (err) {
            throw new ApplicationError(`Unknown Error: ${err} `);
        }
        const users:IUser[] = res.data;
        return users;
    }

    /**
     * This function gets an hierarchy in an array form and reduce it to a long string format
     * @param hierarchy - The hierarchy array.
     */
    public static flattenHierarchy(hierarchy: string[]): string {
        return hierarchy.reduce((x, y) => `${x}/${y}`);
    }

    /**
     * Adds an Authorization header with an updated authentication token
     * from spike to the axios instance to kartoffel.
     */
    private async addAuthInterceptor() {
        this.axiosInstance.interceptors.request.use(async (config) => {
            const token: string = await this.SpikeService.getToken();
            config.headers = {
                Authorization: token,
            };
            return config;
        });
    }
}
