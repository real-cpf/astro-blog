exports.handler = async function (event, context) {
    const data = fetch({
        method:'POST',
        url:process.env.TRELLO_LASTDAY_URL,
        headers:{
            'realcpf-ak': process.env.AK_VALUE,
            'realcpf-ak': process.env.SK_VALUE
        }
    })
    return {
      statusCode: 200,
      body: JSON.stringify({ message: data }),
    };
  };
  