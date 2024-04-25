import { Button, Flex, Modal, Textarea } from "@mantine/core";
import { useMutation } from "react-query";
import { TTodo } from "../../types/types";
import { DatePickerInput } from "@mantine/dates";
import { useState } from "react";

export function ModalContent({
  setNewTodoText,
  refetch,
  newTodoText,
  opened,
  close,
}: any) {
  const [deadLineValue, setDeadLineValue] = useState<
    [Date | null, Date | null]
  >([null, null]); // add todo to todos
  const addTodo = useMutation(
    (newTodo: TTodo) =>
      fetch(`https://661a3da6125e9bb9f29b9ac1.mockapi.io/api/v1/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTodo),
      }),
    {
      onSuccess: () => {
        refetch(); // Refresh the todos after adding a new todo
        setNewTodoText(""); // Clear the input field after adding a new todo
        close(); // Close the modal after adding a new todo
      },
    }
  );

  const hendleAddNewTodo = () => {
    if (newTodoText.trim() !== "") {
      addTodo.mutate({
        text: newTodoText,
        deadline: deadLineValue,
        completed: false,
        id: Math.random().toString(),
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="add todo"
      centered
      style={{
        position: "absolute",
        left: 0,
        marginLeft: "auto",
        marginRight: "auto",
        width: "fit-content",
        zIndex: 20,
      }}
    >
      <Flex
        style={{
          justifyContent: "center",
          gap: 8,
          alignmentBaseline: "baseline",
        }}
      >
        <Textarea
          resize="both"
          placeholder="enter text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)} // Update the new todo text as the user types
        />
        <DatePickerInput
          valueFormat="YYYY-MM-DD "
          type="range"
          placeholder="Pick dates"
          defaultValue={deadLineValue}
          onChange={setDeadLineValue}
        />
        <Button onClick={hendleAddNewTodo}>save</Button>
      </Flex>
    </Modal>
  );
}
