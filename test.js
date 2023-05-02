const Strapi = require('strapi');

let instance;

async function setupStrapi() {
  if (!instance) {
    await Strapi().load();
    instance = strapi;
  }
  return instance;
}

const isUrlMatchedToRoutePath = (layer, url, method, header) => {
  if (layer.path != url) {
    return false
  }
  if (layer.methods.indexOf(method) == -1) {
    return false
  }
  return true
}

const isUrlMatchedToRoute = (layer, url, method, header) => {
  if (!layer.match(url)) {
    return false
  }
  if (layer.methods.indexOf(method) == -1) {
    return false
  }
  return true
}

const stackFunction = async (stack, ctx, idx) => {
  if (idx == stack.length - 1) {
    const res = await stack[idx](ctx)
    return res
  }
  return await stack[idx](ctx, () => stack[idx + 1](ctx))
}

const testEndpoint = async (url, method, header, payload) => {
  const exactMatchedlayers = instance.router.stack.filter(layer => {
    if (!isUrlMatchedToRoutePath(layer, url, method, header)) {
      return false
    }
    return true
  })

  const layers = instance.router.stack.filter(layer => {
    if (!isUrlMatchedToRoute(layer, url, method, header)) {
      return false
    }
    return true
  })

  if (layers.length > 0) {
    const exactLayer = exactMatchedlayers.length > 0 ? exactMatchedlayers.pop() : layers.pop()
    const index = exactLayer.methods.indexOf(method)
    const searchParams = url.indexOf('?') > -1 ? new URLSearchParams(url.substring(url.indexOf('?'))) : {};

    const captures = exactLayer.captures(url)
    const params = exactLayer.params(url, captures, {})

    let ctx = {
      query: searchParams,
      body: payload,
      request: {
        header: header
      },
      params,
      state: {},
      send: (data) => console.log(data)
    }

    try {
      await stackFunction(exactLayer.stack, ctx, 0)
    } catch (error) {
      console.log("Something went wrong", error)
    }
    // test api
  } else {
    console.log("Wrong API endpoint")
  }
  return
}

const main = async () => {
  await setupStrapi();

  const URL = "/users/me"
  const METHOD = "GET"
  const HEADER = {"authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNjgzMDQzMjU3LCJleHAiOjE2ODU2MzUyNTd9.T6BHqg41MaPavv6fY6OGffGrOrGMLr5GDIiHHY-3frY"};
  const PAYLOAD = {"username":"hello"}

  await testEndpoint(URL, METHOD, HEADER, PAYLOAD)
}

main()
