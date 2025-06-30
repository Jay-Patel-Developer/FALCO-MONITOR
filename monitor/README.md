# Falco Monitor - Frontend (monitor)

This is the frontend React application for the Falco Monitor project. It provides a modern dashboard and analytics view for Falco security alerts, designed for extensibility and integration with a Go backend API.

## Features

- **Falco Analytics Dashboard**: Visualizes Falco alert data with interactive charts (Line, Bar, Pie, Area, Treemap) using [Recharts](https://recharts.org/).
- **Material UI**: Clean, responsive design with Material UI theming and components.
- **Demo Data**: Loads sample data from JSON files for development and UI prototyping.
- **Live Data (Phase 1)**: Can be switched to fetch live analytics and alerts from the Go backend via WebSocket endpoints (`/ws/analytics`, `/ws/alerts`).
- **Extensible**: Future iterations will add more analytics and alert actions.

## Project Structure

```
monitor/
  public/
    sample_alerts.json
    sample_charts_data.json
    ...
  src/
    App.tsx
    FalcoAnalyticsView.tsx
    FalcoAlertsDashboard.tsx
    ...
  package.json
  tsconfig.json
  ...
```

## Getting Started

1. **Install dependencies**

   ```bash
   cd monitor
   npm install
   ```

2. **Run the development server**

   ```bash
   npm run dev
   ```

3. **View the dashboard**

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Switching Between Demo and Live Data

- By default, analytics loads from `public/sample_charts_data.json` for demo/testing.
- To use live backend data, update `FalcoAnalyticsView.tsx` to use the WebSocket connection (`ws://localhost:8080/ws/analytics`).
- The alerts dashboard always uses live data from the backend (`ws://localhost:8080/ws/alerts`).

## Phase 1 Completion

- All core dashboard and analytics features are implemented.
- Frontend is ready for further enhancements and backend integration.

## Data Sources

- **Current**: Loads static demo data from `public/sample_charts_data.json` and related files.
- **Planned**: Future versions will fetch data from the backend API (see `../backend/`).

## Key Files

- `src/FalcoAnalyticsView.tsx`: Main analytics dashboard with all charts and metrics.
- `src/FalcoAlertsDashboard.tsx`: (Planned) Detailed alert table and filtering.
- `public/sample_charts_data.json`: Demo data for analytics charts.

## Customization

- **Theming**: Uses Material UI's theme for light/dark mode and color customization.
- **Charts**: Easily add or modify charts in `FalcoAnalyticsView.tsx`.

## Contributing

1. Fork the repo and create a feature branch.
2. Make your changes and add tests if needed.
3. Submit a pull request.

## License

MIT License
