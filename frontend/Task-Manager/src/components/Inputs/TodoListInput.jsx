// You can create a new component or replace the existing TodoListInput
import React, { useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";

const TodoListInput = ({ todoList, setTodoList }) => {
  const [newTodoText, setNewTodoText] = useState("");

  // Add a new todo item to the list
  const handleAddTodo = () => {
    if (newTodoText.trim() !== "") {
      setTodoList([...todoList, { text: newTodoText, completed: false }]);
      setNewTodoText("");
    }
  };

  // Remove a todo item from the list
  const handleRemoveTodo = (index) => {
    const updatedList = todoList.filter((_, i) => i !== index);
    setTodoList(updatedList);
  };

  // Toggle the 'completed' status of a todo item
  const handleToggleCompleted = (index) => {
    const updatedList = [...todoList];
    updatedList[index].completed = !updatedList[index].completed;
    setTodoList(updatedList);
  };

  return (
    <div>
      {/* List of existing todo items */}
      {todoList?.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-md mb-2"
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={item.completed || false}
              onChange={() => handleToggleCompleted(index)}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none cursor-pointer"
            />
            <p className="text-sm text-gray-800">{item.text}</p>
          </div>
          <button
            onClick={() => handleRemoveTodo(index)}
            className="text-slate-400 hover:text-rose-500"
          >
            <LuTrash2 />
          </button>
        </div>
      ))}

      {/* Input to add a new todo item */}
      <div className="flex items-center gap-2 mt-3">
        <input
          placeholder="Add a new todo item"
          className="form-input flex-1"
          value={newTodoText}
          onChange={({ target }) => setNewTodoText(target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
        />
        <button
          className="p-2 bg-primary text-white rounded-md hover:bg-primary/90"
          onClick={handleAddTodo}
        >
          <LuPlus />
        </button>
      </div>
    </div>
  );
};

export default TodoListInput;