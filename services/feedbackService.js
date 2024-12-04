const { formatDateToLocalString } = require('../utils/dateUtils');

async function getFeedbackCount(client, startTime, endTime, projectId, env) {
  const query = `
    SELECT
      SUM(CASE WHEN user_feedback ILIKE '%positive 👍%' THEN 1 ELSE 0 END) AS positive_count,
      SUM(CASE WHEN user_feedback ILIKE '%negative 👎%' THEN 1 ELSE 0 END) AS negative_count,
      COUNT(*) AS total
    FROM feedbacksubmisison
    WHERE timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4
  `;

  try {
    const result = await client.query(query, [startTime, endTime, projectId, env]);

    if (result.rows.length === 0) return null;

    const { positive_count = 0, negative_count = 0, total = 0 } = result.rows[0];
    const average = total ? (positive_count / total) * 100 : 0;

    return {
      startTime: formatDateToLocalString(new Date(startTime)),
      endTime: formatDateToLocalString(new Date(endTime)),
      positive_count,
      negative_count,
      total,
      average
    };
  } catch (err) {
    console.error('Error fetching feedback count', err);
    return null;
  }
}

async function getFeedbackTopics(client, startTime, endTime, projectId, env) {
  try {
    const [top3PositiveResult, top3NegativeResult, top5TopicsResult] = await Promise.all([
      client.query(`
        SELECT current_topic AS topPositive, COUNT(*) AS count
        FROM feedbacksubmisison
        WHERE user_feedback ILIKE '%positive 👍%'
        AND timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4
        GROUP BY current_topic
        ORDER BY COUNT(*) DESC
        LIMIT 3
      `, [startTime, endTime, projectId, env]),
      client.query(`
        SELECT current_topic AS topNegative, COUNT(*) AS count
        FROM feedbacksubmisison
        WHERE user_feedback ILIKE '%negative 👎%'
        AND timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4
        GROUP BY current_topic
        ORDER BY COUNT(*) DESC
        LIMIT 3
      `, [startTime, endTime, projectId, env]),
      client.query(`
        SELECT current_topic, COUNT(*) AS count
        FROM feedbacksubmisison
        WHERE timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4
        GROUP BY current_topic
        ORDER BY COUNT(*) DESC
        LIMIT 5
      `, [startTime, endTime, projectId, env])
    ]);

    return {
      startTime: formatDateToLocalString(new Date(startTime)),
      endTime: formatDateToLocalString(new Date(endTime)),
      top3Positive: top3PositiveResult.rows.map(row => ({
        topPositive: row.toppositive,
        count: parseInt(row.count, 10)
      })),
      top3Negative: top3NegativeResult.rows.map(row => ({
        topNegative: row.topnegative,
        count: parseInt(row.count, 10)
      })),
      top5Topics: top5TopicsResult.rows.map(row => row.current_topic)
    };
  } catch (err) {
    console.error('Error fetching feedback topics', err);
    return null;
  }
}

module.exports = {
  getFeedbackCount,
  getFeedbackTopics
};
