const asyncHandler = (fn) => async (req,res,next) =>{   // We have created a wrapper function that can be used to handle asynchronous functions 
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}



export {asyncHandler}