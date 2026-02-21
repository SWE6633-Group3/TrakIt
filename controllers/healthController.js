exports.getHealth = (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Backend server is running smoothly'
    });
};