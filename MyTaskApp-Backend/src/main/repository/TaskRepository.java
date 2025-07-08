package main.repository;

import main.model.Task;
import main.model.TaskPriority;
import main.model.TaskStatus;
import main.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends MongoRepository<Task, String> {
    List<Task> findByIdAndUser(String id, User user);
    List<Task> findAllByUser(User user);

    @Query("{ 'user' : ?0, $and: [ " +
            "{ 'status' : ?1 }, " +
            "{ 'priority' : ?2 }, " +
            "{ 'dueDate' : ?3 } ] }")
    List<Task> findByUserAndFilters(
            User user,
            TaskStatus status,
            TaskPriority priority,
            LocalDate dueDate
    );
}