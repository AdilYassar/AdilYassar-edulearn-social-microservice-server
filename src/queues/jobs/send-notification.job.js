const { notificationQueue } = require('../index');

exports.add = (recipientUUID, notification) => {
    // Add to queue with retry
    notificationQueue.add({
        recipientUUID,
        ...notification
    }, {
        attempts: 3,
        backoff: 5000,
        removeOnComplete: true
    });
};
