export * from "@kong/proxy-wasm-sdk/assembly/proxy";

import {
  RootContext,
  Context,
  registerRootContext,
  log,
  LogLevelValues,
  FilterHeadersStatusValues,
  stream_context
} from "@kong/proxy-wasm-sdk/assembly";

import { JSON } from "json-as/assembly";

@json
class Config {
  my_greeting: string | null;
}

class MyFilterRoot extends RootContext {
  config: Config | null;

  onConfigure(configuration_size: u32): bool {
    let ok = super.onConfigure(configuration_size);
    if (!ok) {
        return false;
    }

    let config = JSON.parse<Config>(this.configuration_);

    if (config.my_greeting === null) {
      config.my_greeting = "Hello";
    }

    this.config = config;

    return true;
  }

  createContext(context_id: u32): Context {
    return new MyFilterHTTP(context_id, this);
  }
}

class MyFilterHTTP extends Context {
  config: Config;

  constructor(context_id: u32, root_context: MyFilterRoot) {
    super(context_id, root_context);
    this.config = root_context.config as Config;
  }

  onResponseHeaders(nHeaders: u32, end_of_stream: bool): FilterHeadersStatusValues {
    stream_context.headers.response.add("X-Greeting", this.config.my_greeting as string);

    return FilterHeadersStatusValues.Continue;
  }
}

registerRootContext((context_id: u32) => {
    return new MyFilterRoot(context_id);
}, "MyFilter");
