import { Button, Flex, Modal, Textarea } from "@mantine/core";
import { QueryClient, useMutation } from "react-query";
import { TTodo } from "../../types/types";
import { DatePickerInput } from "@mantine/dates";
import { useState } from "react";

export function ModalContent({
  setNewTodoText,
  newTodoText,
  opened,
  setTodoData,
  close,
}: any) {
  const [deadLineValue, setDeadLineValue] = useState<
    [Date | null, Date | null]
  >([null, null]);
  const queryClient = new QueryClient();

  const addTodo = useMutation(
    async (newTodo: TTodo) => {
      const response = await fetch(
        `https://661a3da6125e9bb9f29b9ac1.mockapi.io/api/v1/todos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTodo),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add todo");
      }
      return await response.json(); 
    },
    {
      onSuccess: (data: TTodo) => {
        // Update the cached data after adding
        queryClient.setQueryData<TTodo[] | undefined>("todos", (prevData) => {
          return prevData ? [...prevData, data] : [data];
        });
        setTodoData((prev: TTodo[] | undefined) => {
          if (prev) {
            return [...prev, data];
          } else {
            return [data];
          }
        });
        setNewTodoText(""); // Clear the input field after adding a new todo
        close(); // Close the modal after adding a new todo
      },
      onSettled: () => {
        queryClient.invalidateQueries("todos"); // Manually update cache after adding a new todo
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
          onChange={(e) => setNewTodoText(e.target.value)} 
        />
        <DatePickerInput
          valueFormat="YYYY-MM-DD"
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
