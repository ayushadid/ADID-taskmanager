import { API_PATHS } from "./apiPaths";
import axiosInstance from "./axiosinstance";

const uploadImage=async(imageFile)=>{
    const formData=new FormData();
    //append image file
    formData.append('image',imageFile);

    try{
        const response=await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, formData,{
            headers:{
                'Content-Type':'multipart/form-data',//set header for file upload
            },
        });
        return response.data;
    } catch(error){
        console.error('Error uploading the image',error);
        throw error;
    }
};
export default uploadImage