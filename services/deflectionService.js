const axios = require('axios');
const { formatDateToLocalString, formatDateForVoiceflow } = require('../utils/dateUtils');

async function getDeflectionCount(client, startTime, endTime, projectId, env) {
  try {
    const handoffResponse = await client.query(
      `SELECT COUNT(*) as handoffs FROM public.deflection WHERE timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4`,
      [startTime, endTime, projectId, env]
    );
    const handoffCount = parseInt(handoffResponse.rows[0].handoffs, 10);

    const formattedStartTime = formatDateForVoiceflow(startTime);
    const formattedEndTime = formatDateForVoiceflow(endTime);

    const totalResponse = await axios.post('https://analytics-api.voiceflow.com/v1/query/usage', {
      query: [{
        name: 'sessions',
        filter: {
          projectID: projectId, // Use projectId from header
          startTime: formattedStartTime,
          endTime: formattedEndTime
        }
      }]
    }, {
      headers: {
        accept: 'application/json',
        authorization: 'VF.DM.672fa945120f283a4786e532.eAWxjzDUzvTk0Ysy',
        'content-type': 'application/json'
      }
    });

    const totalConversations = totalResponse.data.result[0].count;
    const deflected = totalConversations - handoffCount;
    const deflectionRate = totalConversations > 0 ? (deflected / totalConversations) * 100 : 0;

    return {
      startTime: formatDateToLocalString(new Date(startTime)),
      endTime: formatDateToLocalString(new Date(endTime)),
      totalConversations,
      handoffs: handoffCount,
      deflected,
      deflectionRate: deflectionRate.toFixed(2)
    };
  } catch (err) {
    console.error('Error fetching deflection data', err);
    return null;
  }
}

async function getDeflectionTopics(client, startTime, endTime, projectId, env) {
  try {
    const result = await client.query(`
      SELECT current_topic, COUNT(*) AS topic_count
      FROM public.deflection
      WHERE timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4
      GROUP BY current_topic
      ORDER BY topic_count DESC
      LIMIT 3;
    `, [startTime, endTime, projectId, env]);

    return {
      startTime: formatDateToLocalString(new Date(startTime)),
      endTime: formatDateToLocalString(new Date(endTime)),
      top3HandoffTopics: result.rows.map(row => ({
        current_topic: row.current_topic,
        count: parseInt(row.topic_count, 10)
      }))
    };
  } catch (err) {
    console.error('Error fetching top handoff topics', err);
    return null;
  }
}

module.exports = {
  getDeflectionCount,
  getDeflectionTopics
};
