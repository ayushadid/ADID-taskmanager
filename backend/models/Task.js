const mongoose=require("mongoose");

const todoSchema=new mongoose.Schema(
    {
        text:{type: String,required:true},
        completed:{type:Boolean,required:true},
    }
);

const remarkSchema = new mongoose.Schema(
    {
        text: { type: String, required: true },
        madeBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
    }
);

const TaskSchema=new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        title: {type:String, required:true},
        description:{type:String},
        priority:{type:String, enum: ["Low","Medium","High"],default:"Medium"},
        status:{type:String, enum:["Pending","In Progress","Completed"],default:"Pending"},
        dueDate:{type:Date, required:true},
        assignedTo:[{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
        createdBy:{type:mongoose.Schema.Types.ObjectId, ref:"User"},
        attachments: [{type:String}],
        todoChecklist:[todoSchema],
        progress:{type:Number, default:0},
        remarks: [remarkSchema], 
    },
    {timestamps:true}
);


module.exports=mongoose.model("Task",TaskSchema);