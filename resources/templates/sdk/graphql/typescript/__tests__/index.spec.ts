import Sdk, {createSdk, createEnvSdk} from '../src';
import {fetch} from '../src/types';

describe('Sdk', () => {
    it('constructor', () => {
        const fetch = jest.fn();

        expect(new Sdk({
            endpoints: {
                graphql: 'http://localhost:0',
                rest: 'http://localhost:1',
            },
            fetch: fetch as fetch,
        })).toBeDefined();
    });
});

describe('createSdk', () => {
    it('call factory return a new Sdk instance', () => {
        const fetch = jest.fn();

        expect(createSdk('http://localhost:1', 'http://localhost:0', fetch)).toBeInstanceOf(Sdk);
    });
});

describe('createEnvSdk', () => {
    it('call factory return a new preconfigured Sdk instance', () => {
        expect(createEnvSdk()).toBeInstanceOf(Sdk);
    });
});
