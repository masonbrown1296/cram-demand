module.exports = async function (context, req) {
  context.res = {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: {
      ok: true,
      note: "recommend reached",
      method: req.method,
      hasBody: !!req.body,
    },
  };
};
