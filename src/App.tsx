import { useMutation, useQuery } from "react-query";
import { Button, Table, Modal, Input, Flex } from "@mantine/core";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";

type TTodo = { text: string; deadline: string; completed: boolean; id: string };

function App() {
  const [newTodoText, setNewTodoText] = useState<string>(""); // State variable to store the text of the new todo or todotoupdate
  const [opened, { open, close }] = useDisclosure(false);
  const { data, isLoading, isError, refetch } = useQuery<TTodo[]>(
    "todos",
    async () => {
      const response = await fetch(
        "https://661a3da6125e9bb9f29b9ac1.mockapi.io/api/v1/todos"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }
      return response.json();
    }
  );
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching todos</div>;
  const todoList = data!;


  // add todo to todos
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

  //  get current date of day
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Adding leading zero if needed
  const day = String(today.getDate()).padStart(2, "0"); // Adding leading zero if needed
  const currentDate = `${year}-${month}-${day}`;

  const hendleAddNewTodo = () => {
    if (newTodoText.trim() !== "") {
      addTodo.mutate({
        text: newTodoText,
        deadline: currentDate,
        completed: false,
        id: Math.random().toString(),
      });
    }
  };

  // delete todo from todos

  const deleteTodo = useMutation(
    (id: string) =>
      fetch(`https://661a3da6125e9bb9f29b9ac1.mockapi.io/api/v1/todos/${id}`, {
        method: "DELETE",
      }),
    {
      onSuccess: () => {
        refetch(); // Refresh the todos after deletion
      },
    }
  );
  const hendelDelete = async (id: string) => {
    try {
      await deleteTodo.mutateAsync(id); // Trigger the delete mutation
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  // hendelUpdate todo in todos
  const hendelUpdate = async (id: string) => {
    const todoToUpdate = todoList.find((todo) => todo.id === id);
    if (todoToUpdate) {
      const response = await fetch(
        `https://661a3da6125e9bb9f29b9ac1.mockapi.io/api/v1/todos/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...todoToUpdate,
            text: newTodoText, // Update text with newTodoText
            deadline: currentDate,
            completed: true, // Set completed to true
          }),
        }
      );
      if (response.ok) {
        refetch(); // Refresh the todos after updating
        setNewTodoText("")
      }
    }
  };



  // define rows for table
  const rows = todoList.map((todo: TTodo) => (
    <Table.Tr key={todo.id}>
      <Table.Td>
        <Input defaultValue={todo.text} onChange={(e)=>setNewTodoText(e.target.value)} 
         />
      </Table.Td>
      <Table.Td>{todo.deadline}</Table.Td>
      <Table.Td>{todo.completed ? "true" : "false"}</Table.Td>
      <Table.Td>
      <Button onClick={() => hendelUpdate(todo.id)}>update</Button>
        <Button onClick={() => hendelDelete(todo.id)}>delete</Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title="add todo"
        centered
        style={{ marginLeft: "-800px" }}
      >
        <Flex>
          <Input
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)} // Update the new todo text as the user types
          />
          
          <Button onClick={hendleAddNewTodo}>save</Button>
        </Flex>
      </Modal>
      <Table
        highlightOnHover
        withTableBorder
        withColumnBorders
        verticalSpacing="lg"
        horizontalSpacing="xl"
        style={{width:window.innerWidth}}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Text</Table.Th>
            <Table.Th>deadline</Table.Th>
            <Table.Th>complited</Table.Th>
            <Table.Th>
              <Button onClick={open}>add new todo</Button> {/* open modal */}
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows.reverse()}</Table.Tbody>
      </Table>
    </>
  );
}

export default App;
