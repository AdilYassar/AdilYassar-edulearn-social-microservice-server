exports.initialize = async (req, res) => {
  // The middleware already handles creation/retrieval
  // This endpoint just confirms everything is set up and returns the profile
  res.status(200).json({
    status: 'success',
    user: req.user
  });
};
