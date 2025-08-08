# Project Instructions: imc-ragmon


---

## 1. Project Overview & Goal

*   **What is the primary goal of this project?**
    *  This should serve as a monitoring UI for a Pipeline created by
        * /Users/dbbaskette/Projects/SCDF-RAG
    * It contains streaming apps (you can review the code and determine what API controls we have available, what actuators, and what data comes in on the Rabbit Q.  hdfsWatcher doesnt currently use the RABBIT method, so is has a single instance running... we will just surface the other controls and display.
        * /Users/dbbaskette/Projects/hdfsWatcher
        * /Users/dbbaskette/Projects/textProc
        * /Users/dbbaskette/Projects/embedProc
    * It also has a log app but we dont need to worry about it.

*   **Who are the end-users?**
    *  User monitoring or demonstrating a RAG Pipelin

## 2. Tech Stack

*   **Language(s) & Version(s)**: Java 21
*   **Framework(s)**: Spring Boot 3.5.4,
*   **Database(s)**: local->H2 cloud->Postgresql
*   **Key Libraries**: non known yet
*   **Build/Package Manager**: maven + 

## 3. Architecture & Design

*   **High-Level Architecture**:  Web App with Database for Long term performance/history.  Connects to RabbitMQ to get information about apps it is monitoring

*   **Key Design Patterns**: 

*   **Directory Structure**: Briefly describe the purpose of key directories.
    *   `src/main/java/com/insurancemegacorp/ragmon/`: Main application source
    *   `src/main/resources/`: Configuration files
    *   `docs/`: Project documentation

## 4. Coding Standards & Conventions

*   **Code Style**: Standard Spring + Java
*   **Naming Conventions**: Standard Spring + Java
*   **API Design**: 
*   **Error Handling**: Use custom exception classes", "Return standardized JSON error responses")

## 5. Important "Do's and Don'ts"

*   Write unit tests for all new business logic.
*   Do not commit secrets or API keys directly into the repository.
*   Log important events and errors.