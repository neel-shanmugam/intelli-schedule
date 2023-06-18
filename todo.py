class Task:
    def __init__(self, name, estimated_time):
        self.name = name
        self.estimated_time = estimated_time

    def __str__(self):
        return f"Task: {self.name}\nEstimated Time: {self.estimated_time} minutes"


class TodoList:
    def __init__(self):
        self.tasks = []

    def add_task(self, name, estimated_time):
        task = Task(name, estimated_time)
        self.tasks.append(task)
        print("Task added successfully!")

    def show_tasks(self):
        if self.tasks:
            for index, task in enumerate(self.tasks, 1):
                print(f"Task {index}:")
                print(task)
                print("------------------------")
        else:
            print("No tasks found!")

    def remove_task(self, task_index):
        if 1 <= task_index <= len(self.tasks):
            task = self.tasks.pop(task_index - 1)
            print(f"Task '{task.name}' removed successfully!")
        else:
            print("Invalid task index!")

    def clear_all_tasks(self):
        self.tasks = []
        print("All tasks cleared!")

    def menu(self):
        while True:
            print("\n----- TODO LIST MENU -----")
            print("1. Add a task")
            print("2. Show all tasks")
            print("3. Remove a task")
            print("4. Clear all tasks")
            print("5. Exit")

            choice = input("Enter your choice (1-5): ")

            if choice == "1":
                name = input("Enter the task name: ")
                estimated_time = int(input("Enter the estimated time for completion (in minutes): "))
                self.add_task(name, estimated_time)
            elif choice == "2":
                self.show_tasks()
            elif choice == "3":
                task_index = int(input("Enter the task index to remove: "))
                self.remove_task(task_index)
            elif choice == "4":
                self.clear_all_tasks()
            elif choice == "5":
                print("Goodbye!")
                break
            else:
                print("Invalid choice! Try again.")


# Create a new TodoList instance
todo_list = TodoList()

# Run the todo list application
todo_list.menu()
