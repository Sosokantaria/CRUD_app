import { Button, Textarea, Group, Switch, Table } from "@mantine/core";
import { QueryClient, useMutation, useQuery } from "react-query";
import { DatePickerInput } from "@mantine/dates";
import { useState, useEffect } from "react";
import { useDisclosure } from "@mantine/hooks";
import { ModalContent } from "./components/modal";
import { TTodo } from "./types/types";

function App() {
  const [todoData, setTodoData] = useState<TTodo[] | undefined>();
  const [newTodoText, setNewTodoText] = useState<string>("");
  const [opened, { open, close }] = useDisclosure(false);
  const [deadLineValue, setDeadLineValue] = useState<
    [Date | null, Date | null]
  >([null, null]);
  const [completionStatus, setCompletionStatus] = useState<
    Record<string, boolean>
  >({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const queryClient = new QueryClient();

  // Fetch initial data and store it in the cache
  const { data, isLoading, isError } = useQuery<TTodo[]>("todos", async () => {
    const response = await fetch(
      "https://661a3da6125e9bb9f29b9ac1.mockapi.io/api/v1/todos"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch todos");
    }
    const initialData = await response.json();
    // Store initial data in the cache
    queryClient.setQueryData("todos", initialData);
    return initialData;
  });

  const deleteTodo = useMutation(
    (id: string) =>
      fetch(`https://661a3da6125e9bb9f29b9ac1.mockapi.io/api/v1/todos/${id}`, {
        method: "DELETE",
      }),
    {
      onSuccess: (_data, id) => {
        // Update the cached data after deletion
        queryClient.setQueryData<TTodo[] | undefined>("todos", (prevData) => {
          return prevData?.filter((todo) => todo.id !== id) || [];
        });
        // Remove the deleted todo from the todoData state
        setTodoData((prevData) => prevData?.filter((todo) => todo.id !== id));
      },
    }
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const handleSwitchChange = (id: string, completed: boolean) => {
    setCompletionStatus((prevStatus) => ({
      ...prevStatus,
      [id]: completed,
    }));
  };

  const handleTextChange = (id: string, text: string) => {
    setEditingId(id);
    setNewTodoText(text);
  };

  const handleDeadlineChange = (value: [Date | null, Date | null]) => {
    setDeadLineValue(value);
  };

  const handleUpdate = async (id: string) => {
    const todoToUpdate = data?.find((todo) => todo.id === id);
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
            text: newTodoText !== "" ? newTodoText : todoToUpdate.text,
            deadline:
              deadLineValue[0] !== null || deadLineValue[1] !== null
                ? deadLineValue
                : todoToUpdate.deadline,
            completed: completionStatus[id],
          }),
        }
      );
      if (response.ok) {
        queryClient.setQueryData<TTodo[] | undefined>("todos", (prevData) => {
          // Update the cached data with the modified todo
          return (
            prevData?.map((todo) =>
              todo.id === id
                ? {
                    ...todo,
                    text: newTodoText,
                    deadline: deadLineValue,
                    completed: completionStatus[id],
                  }
                : todo
            ) || []
          );
        });
        setNewTodoText("");
        setEditingId(null);
      }
    }
  };

  useEffect(() => {
    if (data) {
      const initialCompletionStatus = data.reduce((acc, todo) => {
        acc[todo.id] = todo.completed;
        return acc;
      }, {} as Record<string, boolean>);
      setCompletionStatus(initialCompletionStatus);
      setTodoData(data);
    }
  }, [data]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching todos</div>;

  const rows =
    todoData?.map((todo: TTodo) => (
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
              checked={!!completionStatus[todo.id]}
              onChange={(event) =>
                handleSwitchChange(todo.id, event.currentTarget.checked)
              }
            />
          </Group>
        </Table.Td>
        <Table.Td>
          <Button onClick={() => handleUpdate(todo.id)}>update</Button>
          <Button onClick={() => handleDelete(todo.id)}>delete</Button>
        </Table.Td>
      </Table.Tr>
    )) || [];

  return (
    <>
      <ModalContent
        opened={opened}
        setNewTodoText={setNewTodoText}
        newTodoText={newTodoText}
        setTodoData={setTodoData}
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
              <Button onClick={open}>add new todo</Button>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows.reverse()}</Table.Tbody>
      </Table>
    </>
  );
}

export default App;
