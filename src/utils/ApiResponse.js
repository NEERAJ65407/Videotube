class ApiResponse{ //Use to standardise the api response 
    constructor(statusCode,data,message =" Success"){
        this.statusCode = statusCode,
        this.data =data,
        this.message = message,
        this.success = statusCode < 400
    }
}

export {ApiResponse};