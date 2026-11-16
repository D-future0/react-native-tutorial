# Student Management

## Navigation architecture

The app uses Expo Router's file-based routing. The `main` entry in
`package.json` is `expo-router/entry`, which loads the routes in `app/`.
Typed routes are enabled in `app.json`; Expo CLI generates the route types
under `.expo/types` when the development server starts.

```text
app/
  _layout.tsx              Root stack navigator
  (tabs)/
    _layout.tsx            Tab navigator
    index.tsx              Dashboard tab (/)
    students.tsx            Students tab (/students)
    settings.tsx            Settings tab (/settings)
  students/
    [id].tsx                Student details (/students/:id)
```

### How navigation works

- The root `Stack` in `app/_layout.tsx` contains the tab group and student
  details route. Its header is hidden for `(tabs)` so the group name does not
  appear above the tab screens.
- The `(tabs)` directory is a route group: its name organizes routes but is
  omitted from their URLs. Its `_layout.tsx` defines the Dashboard, Students,
  and Settings tabs.
- The dashboard navigates to `/students` and `/settings`. Student cards navigate
  to `/students/<student-id>`, which matches `app/students/[id].tsx`.
- Student details are pushed on the root stack above the tabs. The detail
  screen's back button is labeled “Students”.
- Dashboard and student-card links use Expo Router's typed `Link` component.
  Dynamic student links provide the `[id]` parameter explicitly.
- The dashboard counts unique `className` values and treats the last student in
  `src/data/students.ts` as the most recently registered one.
