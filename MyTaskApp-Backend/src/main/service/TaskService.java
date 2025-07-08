package main.service;

import main.dto.TaskRequest;
import main.dto.TaskResponse;
import main.exception.TaskNotFoundException;
import main.model.Task;
import main.model.TaskPriority;
import main.model.TaskStatus;
import main.model.User;
import main.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;

    public TaskResponse createTask(TaskRequest request, User user) {
        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .priority(request.getPriority())
                .dueDate(request.getDueDate())
                .createdAt(LocalDate.now())
                .user(user)
                .build();

        taskRepository.save(task);
        return mapToTaskResponse(task);
    }

    public List<TaskResponse> getAllTasks(User user, TaskStatus status, TaskPriority priority, LocalDate dueDate) {
        List<Task> tasks = taskRepository.findByUserAndFilters(user, status, priority, dueDate);
        return tasks.stream()
                .map(this::mapToTaskResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse getTaskById(String id, User user) {
        Task task = (Task) taskRepository.findByIdAndUser(id, user);
        if (((List<?>) task).isEmpty()) {
            throw new TaskNotFoundException("Task not found");
        }
        return mapToTaskResponse(task);
    }

    public TaskResponse updateTask(String id, TaskRequest request, User user) {
        Task task = (Task) taskRepository.findByIdAndUser(id, user);
        if (((List<?>) task).isEmpty()) {
            throw new TaskNotFoundException("Task not found");
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());
        task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());

        taskRepository.save(task);
        return mapToTaskResponse(task);
    }

    public void deleteTask(String id, User user) {
        Task task = (Task) taskRepository.findByIdAndUser(id, user);
        if (((List<?>) task).isEmpty()) {
            throw new TaskNotFoundException("Task not found");
        }
        taskRepository.delete(task);
    }

    private TaskResponse mapToTaskResponse(Task task) {
        return TaskResponse.builder()
                .id(Long.valueOf(task.getId()))
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .createdAt(task.getCreatedAt())
                .build();
    }
}