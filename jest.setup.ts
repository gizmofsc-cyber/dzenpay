import '@testing-library/jest-dom'

process.env.NODE_ENV = process.env.NODE_ENV || 'test'

const { TextEncoder, TextDecoder } = require('util')
const { ReadableStream, WritableStream } = require('stream/web')
const { MessageChannel, MessagePort } = require('worker_threads')

if (!global.TextEncoder) {
  // @ts-ignore
  global.TextEncoder = TextEncoder
}

if (!global.TextDecoder) {
  // @ts-ignore
  global.TextDecoder = TextDecoder
}

if (!global.ReadableStream) {
  // @ts-ignore
  global.ReadableStream = ReadableStream
}

if (!global.WritableStream) {
  // @ts-ignore
  global.WritableStream = WritableStream
}

if (!global.MessageChannel) {
  // @ts-ignore
  global.MessageChannel = MessageChannel
}

if (!global.MessagePort) {
  // @ts-ignore
  global.MessagePort = MessagePort
}

const { fetch, Response, Request, Headers } = require('undici')

if (!global.fetch) {
  // @ts-ignore
  global.fetch = fetch
}

if (!global.Response) {
  // @ts-ignore
  global.Response = Response
}

if (!global.Request) {
  // @ts-ignore
  global.Request = Request
}

if (!global.Headers) {
  // @ts-ignore
  global.Headers = Headers
}

