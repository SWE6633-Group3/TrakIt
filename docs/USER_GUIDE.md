# TrakIt User Guide

## Overview

TrakIt is a project tracking application for managing project workspaces, requirements, risks, and team access. The app is designed for a class MVP demonstration and includes a modern dashboard, project portfolio views, team role management, password reset support, and light/dark theme preferences.

This guide is intended for instructors or reviewers who need to evaluate the application quickly.

## Application URLs

Update these URLs if your deployment changes.

| Service | URL |
| --- | --- |
| Frontend | https://trak-it-frontend.onrender.com |
| Backend health check | https://trak-it-backend.onrender.com/api/health |

## Demo Accounts

If the production database has been seeded, the following accounts are available. All seeded users use the same demo password.

| Name | Email | Password |
| --- | --- | --- |
| Louis Muhammad | lmuham10@students.kennesaw.edu | passworD12345! |
| Aaliyah McElrath | amcelra1@students.kennesaw.edu | passworD12345! |
| Anthony Nguyen | anguy131@students.kennesaw.edu | passworD12345! |
| Joseph Pentecost | jpenteco@students.kennesaw.edu | passworD12345! |
| Matthew Maravilla | mmaravil@students.kennesaw.edu | passworD12345! |
| Yukang Shen | yshen4@students.kennesaw.edu | passworD12345! |

Additional seeded demo users may also be available for adding to project teams.

## Getting Started

1. Open the frontend URL in a browser.
2. Select **Log in**.
3. Enter one of the demo email addresses and the shared demo password.
4. After login, the app opens the **Dashboard**.

If no projects are available, the dashboard displays an empty state with a button to create the first project.

## Main Navigation

After logging in, the app uses a persistent sidebar on desktop and a compact top navigation menu on mobile.

Main navigation options:

| Page | Purpose |
| --- | --- |
| Dashboard | High-level portfolio overview with stats, charts, and project attention items. |
| Projects | List of accessible projects and portfolio-level project details. |
| New Project | Create a new project workspace. |
| Recent Projects | Quick access to recently available projects from the sidebar. |
| Active Project Subnav | Shows Overview, Requirements, Risks, and Team for the selected project. |

The user profile menu is available from the logged-in user button. It includes theme settings and logout.

## Dashboard

The dashboard provides a portfolio-level overview of the user's projects.

Dashboard sections include:

| Section | Description |
| --- | --- |
| KPI Cards | Shows total projects, requirements, risks, team seats, health score, open flags, average requirements, and average team size. |
| Portfolio Health | Ring chart showing overall portfolio health. |
| Requirements Chart | Visual breakdown of projects with no requirements, low requirements, or five or more requirements. |
| Risk Load Chart | Visual breakdown of projects by risk count. |
| Role Split | Shows how many projects the logged-in user leads or participates in as a member. |
| Portfolio Attention | Combined table showing project health, requirements, risks, team size, next action, and user role. |

Health rules:

- **At risk** means the project has missing requirements, a thin team, or three or more risks.
- **Watch** means the project has some risks, a small team, or limited requirements.
- **Healthy** means the project has enough baseline information and no major flags.

## Creating a Project

1. Select **New Project** from the sidebar.
2. Enter a project name.
3. Optionally enter a project description.
4. Select **Save project profile**.

The creator of the project is automatically added as the initial **Lead**.

Team members are not added during project creation. After creating the project, use the **Team** tab to add members and transfer lead responsibility if needed.

## Projects Page

The Projects page shows all projects available to the logged-in user.

From this page, users can:

- View project portfolio metrics.
- Open a project by clicking its row or open button.
- Edit a project name or description.
- Delete a project.
- Create a new project from the top action button.

Deleting a project removes the project and its associated requirements, risks, and team assignments.

## Project Overview

The Project Overview page provides a command-view for a single project.

It includes:

- Project name and description.
- Requirement count.
- Approved requirement count.
- Open risk count.
- Contributor count.
- Current project lead.
- Team member summary.
- Requirements preview.
- Risks preview.
- Link to manage the team.

The project lead is based on the project team role system. A user with the role **Lead** is treated as the manager/lead for the project.

## Requirements

The Requirements page is used to track project requirements.

Users can:

- Add a requirement.
- Set requirement type.
- Set requirement status.
- Edit requirement details.
- Delete requirements.
- Review requirement totals and status breakdowns.

Example requirement statuses:

- Draft
- In review
- Approved

## Risks

The Risks page is used to track project risks.

Users can:

- Add a risk.
- Set risk impact.
- Set risk status.
- Edit risks.
- Delete risks.
- Review risk counts and statuses.

Example risk impacts:

- Low
- Medium
- High

Example risk statuses:

- Open
- Monitoring
- Closed

Risk icons and colors help communicate severity and status visually.

## Team Management

The Team page controls project access and roles.

Users with the **Lead** role can:

- Search for existing users by email.
- Add users to the project.
- Assign users as **Member** or **Lead**.
- Edit a user's role.
- Remove users from the project.

Rules:

- The project creator starts as the initial **Lead**.
- A project should always have a lead.
- The app prevents deleting the current lead unless another lead is already in place.
- Assigning a new user as **Lead** transfers lead responsibility.

Users with the **Member** role can view project information but cannot manage team membership or role assignments.

## Theme Settings

The app supports light and dark themes.

To change the theme:

1. Select the logged-in user button.
2. Open profile/settings controls.
3. Use the theme toggle.

The selected theme is stored locally in the browser.

## Password Reset

The app includes an MVP password reset flow that does not require an email server.

To reset a password:

1. Go to the login page.
2. Select **Forgot password**.
3. Enter the account email address.
4. The app generates and displays a demo reset code.
5. Enter the reset code and a new password.
6. Submit the form to update the password.

This flow is designed for class presentation use. In a production application, reset codes should be sent by email or another secure channel instead of being displayed directly in the app.

## Suggested Professor Evaluation Walkthrough

Use this sequence to test the main app functionality:

1. Open the frontend URL.
2. Log in with a seeded demo account.
3. Review the Dashboard charts and Portfolio Attention table.
4. Open a project from the sidebar or Projects page.
5. Review the Project Overview page.
6. Open the Requirements tab and add or edit a requirement.
7. Open the Risks tab and add or edit a risk.
8. Open the Team tab and add an existing seeded user.
9. Change a team member role to Lead.
10. Try to remove the only Lead and confirm the app prevents it.
11. Use the profile menu to switch themes.
12. Log out and test the password reset flow if desired.

## Local Development Commands

If running locally, use two terminals.

Start the backend:

```bash
npm run server
```

Start the frontend:

```bash
npm run dev
```

Open the frontend locally:

```text
http://localhost:3000
```

The backend runs locally on:

```text
http://localhost:3001
```

## Production Environment Notes

The production frontend should call the backend using this environment variable on the frontend Render service:

```text
NEXT_PUBLIC_API_BASE=https://trak-it-backend.onrender.com
```

The production backend should use persistent SQLite storage with a Render disk:

```text
SQLITE_DB=/var/data/trackit.db
AUTO_SEED_IF_EMPTY=true
```

If enabled, the database auto-seeds only when it is empty. This helps ensure demo data exists after a fresh deployment without wiping existing data on every restart.

## Known MVP Limitations

- Password reset codes are displayed directly in the app for demo purposes.
- Users must already exist before they can be added to a project team.
- File/image upload is not included in the MVP.
- SQLite is used for simplicity and requires persistent disk storage in production.
- The app is optimized for class demonstration rather than enterprise production security.
