const { Client } = require('pg');
const express = require('express');
const dbConfig = require('../config/dbConfig');
const { enumerateDaysBetweenDates } = require('../utils/dateUtils');
const deflectionService = require('../services/deflectionService');
const feedbackService = require('../services/feedbackService');
const surveyService = require('../services/surveyService');
const { validateRequest } = require('../utils/requestValidator');

async function handleAnalyticsRequest(req, res) {
  // Validate request before processing
  if (!validateRequest(req, res)) {
    return; // Exit if validation fails
  }

  const client = new Client(dbConfig);
  const { name, startTime, endTime } = req.body.filter;
  const projectId = req.header('projectid');
  const env = req.header('env');
  const accessToken = req.header('access-token');

  /*if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required' }); 
  }else*/
  if(accessToken != 12345){
    return res.status(404).json({ error: 'Invalid acces token' }); 
  }

  try {
    await client.connect();
    const results = [];

    const dailyRanges = enumerateDaysBetweenDates(startTime, endTime);

    switch (name) {
      case 'get_deflection_count':
        const deflectionCount = await deflectionService.getDeflectionCount(client, startTime, endTime, projectId, env);
        if (deflectionCount && deflectionCount.totalConversations > 0) {
          results.push(deflectionCount);
        }

        for (const range of dailyRanges) {
          const dailyCount = await deflectionService.getDeflectionCount(client, range.start, range.end, projectId, env);
          if (dailyCount && deflectionCount.totalConversations > 0) {
            results.push(dailyCount);
          }
        }
        break;

      case 'get_deflection_topics':
        const deflectionTopics = await deflectionService.getDeflectionTopics(client, startTime, endTime, projectId, env);
        if (
          deflectionTopics.top3HandoffTopics &&
          deflectionTopics.top3HandoffTopics.length > 0
        ) {
          results.push(deflectionTopics);
        }

        for (const range of dailyRanges) {
          const dailyTopics = await deflectionService.getDeflectionTopics(client, range.start, range.end, projectId, env);
          if (
            dailyTopics.top3HandoffTopics &&
            dailyTopics.top3HandoffTopics.length > 0
          ) {
            results.push(dailyTopics);
          }
        }
        break;

      case 'get_feedback_count':
        const feedbackCount = await feedbackService.getFeedbackCount(client, startTime, endTime, projectId, env);
        if (feedbackCount && feedbackCount.total > 0) {
          results.push(feedbackCount);
        }

        for (const range of dailyRanges) {
          const dailyCount = await feedbackService.getFeedbackCount(client, range.start, range.end, projectId, env);
          if (dailyCount && dailyCount.total > 0) {
            results.push(dailyCount);
          }
        }
        break;

      case 'get_feedback_topics':
        const feedbackTopics = await feedbackService.getFeedbackTopics(client, startTime, endTime, projectId, env);
        if (
          (feedbackTopics.top3Positive && feedbackTopics.top3Positive.length > 0) ||
          (feedbackTopics.top3Negative && feedbackTopics.top3Negative.length > 0) ||
          (feedbackTopics.top5Topics && feedbackTopics.top5Topics.length > 0)
        ) {
          results.push(feedbackTopics);
        }

        for (const range of dailyRanges) {
          const dailyTopics = await feedbackService.getFeedbackTopics(client, range.start, range.end, projectId, env);
          if (
            (dailyTopics.top3Positive && dailyTopics.top3Positive.length > 0) ||
            (dailyTopics.top3Negative && dailyTopics.top3Negative.length > 0) ||
            (dailyTopics.top5Topics && dailyTopics.top5Topics.length > 0)
          ) {
            results.push(dailyTopics);
          }
        }
        break;

      case 'get_survey_count':
        const surveyCount = await surveyService.getSurveyCount(client, startTime, endTime, projectId, env);
        if (surveyCount && surveyCount.total_surveys > 0) {
          results.push(surveyCount);
        }

        for (const range of dailyRanges) {
          const dailyCount = await surveyService.getSurveyCount(client, range.start, range.end, projectId, env);
          if (dailyCount && dailyCount.total_surveys > 0) {
            results.push(dailyCount);
          }
        }
        break;

      case 'get_survey_topics':
        const surveyTopics = await surveyService.getSurveyTopics(client, startTime, endTime, projectId, env);

        // Check if any of the key arrays have data
        if (
          (surveyTopics.top3PositiveTopics && surveyTopics.top3PositiveTopics.length > 0) ||
          (surveyTopics.top3NegativeTopics && surveyTopics.top3NegativeTopics.length > 0) ||
          (surveyTopics.top2SurveyTypes && surveyTopics.top2SurveyTypes.length > 0) ||
          (surveyTopics.bottom2SurveyTypes && surveyTopics.bottom2SurveyTypes.length > 0) ||
          (surveyTopics.top5Topics && surveyTopics.top5Topics.length > 0)
        ) {
          results.push(surveyTopics);
        }

        for (const range of dailyRanges) {
          const dailyTopics = await surveyService.getSurveyTopics(client, range.start, range.end, projectId, env);

          // Same comprehensive check for daily topics
          if (
            (dailyTopics.top3PositiveTopics && dailyTopics.top3PositiveTopics.length > 0) ||
            (dailyTopics.top3NegativeTopics && dailyTopics.top3NegativeTopics.length > 0) ||
            (dailyTopics.top2SurveyTypes && dailyTopics.top2SurveyTypes.length > 0) ||
            (dailyTopics.bottom2SurveyTypes && dailyTopics.bottom2SurveyTypes.length > 0) ||
            (dailyTopics.top5Topics && dailyTopics.top5Topics.length > 0)
          ) {
            results.push(dailyTopics);
          }
        }
        break;

      default:
        throw new Error('Invalid analytics type requested');
    }

    if (results.length > 0) {
      res.json({ status: 200, results });
    } else {
      res.status(404).json({ error: 'No data found for the given range.' });
    }
  } catch (err) {
    console.error('Error processing analytics request:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.end();
  }
}

module.exports = {
  handleAnalyticsRequest
};
