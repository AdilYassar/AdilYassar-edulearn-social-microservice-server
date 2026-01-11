const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class QuizServerService {
  constructor() {
    this.baseURL = config.quizServer.url;
    this.internalToken = config.quizServer.internalToken; // Shared secret
  }

  async getUserByUUID(uuid) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/internal/user/${uuid}`,
        {
          headers: {
            'Authorization': `Bearer ${this.internalToken}`,
            'X-Internal-Service': 'social-microservice'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch user ${uuid} from Quiz Server: ${error.message}`);
      // return null to handle gracefully
      return null;
    }
  }

  async getUsersBatch(uuids) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/internal/users/batch`,
        { uuids },
        {
          headers: {
            'Authorization': `Bearer ${this.internalToken}`,
            'X-Internal-Service': 'social-microservice'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch users batch: ${error.message}`);
      return [];
    }
  }

  async getCourseEnrollees(courseId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/internal/courses/${courseId}/students`,
        {
          headers: {
            'Authorization': `Bearer ${this.internalToken}`,
            'X-Internal-Service': 'social-microservice'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch course enrollees for ${courseId}: ${error.message}`);
      return [];
    }
  }
}

module.exports = new QuizServerService();
