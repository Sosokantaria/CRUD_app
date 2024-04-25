import { useMutation, useQuery } from "react-query";
import { Button, Table, Switch, Group, Textarea } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useState, useEffect } from "react";
import { useDisclosure } from "@mantine/hooks";
import { ModalContent } from "./components/modal";
import { TTodo } from "./types/types";

function App() {
  const [newTodoText, setNewTodoText] = useState<string>(""); // State variable to store the text of the new todo or todotoupdate
  const [opened, { open,close }] = useDisclosure(false); // modal
  const [deadLineValue, setDeadLineValue] = useState<[Date | null, Date | null]>([null, null]);
  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch data
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

  useEffect(() => {
    if (data) {
      // Initialize completionStatus after data is fetched
      const initialCompletionStatus = data.reduce((acc, todo) => {
        acc[todo.id] = todo.completed;
        return acc;
      }, {} as Record<string, boolean>);
      setCompletionStatus(initialCompletionStatus);
    }
  }, [data]);

  const todoList = data || [];

  // Delete todo from todos
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

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo.mutateAsync(id); // Trigger the delete mutation
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  // Update completion status of todo item
  const handleSwitchChange = (id: string, completed: boolean) => {
    setCompletionStatus((prevStatus) => ({
      ...prevStatus,
      [id]: completed,
    }));
  };

  // Update todo item text
  const handleTextChange = (id: string, text: string) => {
    setEditingId(id);
    setNewTodoText(text);
  };

  // Update todo item deadline
  const handleDeadlineChange = (value: [Date | null, Date | null]) => {
    setDeadLineValue(value);
  };

  // Update todo item in todos
  const handleUpdate = async (id: string) => {
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
            text: newTodoText !== "" ? newTodoText : todoToUpdate.text, // Preserve existing text if newTodoText is empty
            deadline: deadLineValue[0] !== null || deadLineValue[1] !== null ? deadLineValue : todoToUpdate.deadline,
            completed: completionStatus[id], // Update the completed property based on completionStatus state
          }),
        }
      );
      if (response.ok) {
        refetch(); // Refresh the todos after updating
        setNewTodoText("");
        setEditingId(null);
      }
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching todos</div>;

  // Define rows for table

  const rows = todoList.map((todo: TTodo) => (
    <Table.Tr key={todo.id}>
      <Table.Td>
        <Textarea
          resize="both"
          placeholder={todo.text}
          value={editingId === todo.id ? newTodoText : todo.text}
          onChange={(e) => handleTextChange(todo.id, e.target.value)}
        />
      </Table.Td>
      <Table.Td>
        <DatePickerInput
          valueFormat="YYYY/MM/DD"
          style={{ border: "none" }}
          type="range"
          label="Pick dates"
          placeholder={todo.deadline.toString()}
          defaultValue={deadLineValue}
          onChange={handleDeadlineChange}
        />
      </Table.Td>
      <Table.Td>
        <Group justify="center">
          <Switch
            size="xl"
            onLabel="true"
            offLabel="false"
            checked={completionStatus[todo.id]}
            onChange={(event) => handleSwitchChange(todo.id, event.currentTarget.checked)}
          />
        </Group>
      </Table.Td>
      <Table.Td>
        <Button onClick={() => handleUpdate(todo.id)}>update</Button>
        <Button onClick={() => handleDelete(todo.id)}>delete</Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <ModalContent
        opened={opened}
        setNewTodoText={setNewTodoText}
        newTodoText={newTodoText}
        refetch={refetch}
        close={close}
      />
      <Table
        highlightOnHover
        withTableBorder
        withColumnBorders
        verticalSpacing="lg"
        horizontalSpacing="xl"
        style={{ width: window.innerWidth }}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Text</Table.Th>
            <Table.Th>deadline</Table.Th>
            <Table.Th>completed</Table.Th>
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
