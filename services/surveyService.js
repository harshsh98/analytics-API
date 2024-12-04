const { formatDateToLocalString } = require('../utils/dateUtils');

async function getSurveyCount(client, startTime, endTime, projectId, env) {
  const query = `
    SELECT
      COUNT(*) AS total_surveys,
      SUM(CASE WHEN rating != 'SKIP' AND CAST(rating AS INT) > 3 THEN 1 ELSE 0 END) AS positive_count,
      SUM(CASE WHEN rating != 'SKIP' AND CAST(rating AS INT) < 3 THEN 1 ELSE 0 END) AS negative_count,
      AVG(CASE WHEN rating != 'SKIP' THEN CAST(rating AS FLOAT) ELSE NULL END) AS average_rating,
      SUM(CASE WHEN rating = 'SKIP' THEN 1 ELSE 0 END) AS skipped_surveys
    FROM public."surveySubmisison"
    WHERE timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4
  `;

  try {
    const result = await client.query(query, [startTime, endTime, projectId, env]);
    if (result.rows.length === 0) return null;

    const { total_surveys, positive_count, negative_count, average_rating, skipped_surveys } = result.rows[0];
    const total_submitted = total_surveys - skipped_surveys;
    const completion_rate = total_surveys ? ((total_submitted / total_surveys) * 100) : 0;

    return {
      startTime: formatDateToLocalString(new Date(startTime)),
      endTime: formatDateToLocalString(new Date(endTime)),
      total_surveys,
      positive_count,
      negative_count,
      average_rating,
      skipped_surveys,
      total_submitted,
      completion_rate
    };
  } catch (err) {
    console.error('Error fetching survey count', err);
    return null;
  }
}

async function getSurveyTopics(client, startTime, endTime, projectId, env) {
  try {
    const [top2SurveyTypes, bottom2SurveyTypes, top3PositiveTopics, top3NegativeTopics, top5Topics] = await Promise.all([
      client.query(`
        SELECT
          "surveyType",
          AVG(CAST(rating AS FLOAT)) AS avg_rating
        FROM public."surveySubmisison"
        WHERE timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4
        AND rating != 'SKIP'
        AND CAST(rating AS INT) > 3
        GROUP BY "surveyType"
        ORDER BY avg_rating DESC
        LIMIT 2
      `, [startTime, endTime, projectId, env]),
      client.query(`
        SELECT
          "surveyType",
          AVG(CAST(rating AS FLOAT)) AS avg_rating
        FROM public."surveySubmisison"
        WHERE timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4
        AND rating != 'SKIP'
        AND CAST(rating AS INT) < 3
        GROUP BY "surveyType"
        ORDER BY avg_rating ASC
        LIMIT 2
      `, [startTime, endTime, projectId, env]),
      client.query(`
        SELECT
          current_topic,
          COUNT(*) AS count
        FROM public."surveySubmisison"
        WHERE rating != 'SKIP'
        AND CAST(rating AS INT) > 3
        AND timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4
        GROUP BY current_topic
        ORDER BY count DESC
        LIMIT 3
      `, [startTime, endTime, projectId, env]),
      client.query(`
        SELECT
          current_topic,
          COUNT(*) AS count
        FROM public."surveySubmisison"
        WHERE rating != 'SKIP'
        AND CAST(rating AS INT) < 3
        AND timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4
        GROUP BY current_topic
        ORDER BY count DESC
        LIMIT 3
      `, [startTime, endTime, projectId, env]),
      client.query(`
        SELECT
          current_topic,
          AVG(CAST(rating AS FLOAT)) AS avg_rating
        FROM public."surveySubmisison"
        WHERE rating != 'SKIP'
        AND timestamp BETWEEN $1 AND $2 AND projectId = $3 AND env = $4
        GROUP BY current_topic
        ORDER BY avg_rating DESC
        LIMIT 5
      `, [startTime, endTime, projectId, env])
    ]);

    return {
      startTime: formatDateToLocalString(new Date(startTime)),
      endTime: formatDateToLocalString(new Date(endTime)),
      top2SurveyTypes: top2SurveyTypes.rows.map(row => ({
        surveyType: row.surveyType,
        avg_rating: parseFloat(row.avg_rating)
      })),
      bottom2SurveyTypes: bottom2SurveyTypes.rows.map(row => ({
        surveyType: row.surveyType,
        avg_rating: parseFloat(row.avg_rating)
      })),
      top3PositiveTopics: top3PositiveTopics.rows.map(row => ({
        current_topic: row.current_topic,
        count: parseInt(row.count, 10)
      })),
      top3NegativeTopics: top3NegativeTopics.rows.map(row => ({
        current_topic: row.current_topic,
        count: parseInt(row.count, 10)
      })),
      top5Topics: top5Topics.rows.map(row => row.current_topic)
    };
  } catch (err) {
    console.error('Error fetching survey topics', err);
    return null;
  }
}

module.exports = {
  getSurveyCount,
  getSurveyTopics
};
