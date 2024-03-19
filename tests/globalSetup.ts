import { envCheck, getChainConfig } from "./utils.js"

export default function setup({ provide: _ }) {
  envCheck()
  getChainConfig()
}
