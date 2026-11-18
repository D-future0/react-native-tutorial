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
    directory.tsx           Remote directory tab (/directory)
    settings.tsx            Settings tab (/settings)
  students/
    new.tsx                 Register a student (/students/new)
    [id].tsx                Student details (/students/:id)
    [id]/
      edit.tsx              Edit a student (/students/:id/edit)
  directory/
    [id].tsx                Remote student details (/directory/:id)
    [id]/
      edit.tsx              Edit a remote student (/directory/:id/edit)
src/
  component/StudentForm.tsx Reusable create/edit form
  store/studentStore.ts     Shared Zustand student state
  features/directory/       Remote directory API, queries, and types
```

### How navigation works

- The root `Stack` in `app/_layout.tsx` contains the tab group and student
  details route. Its header is hidden for `(tabs)` so the group name does not
  appear above the tab screens.
- The `(tabs)` directory is a route group: its name organizes routes but is
  omitted from their URLs. Its `_layout.tsx` defines the Dashboard, Students,
  Directory, and Settings tabs.
- The dashboard navigates to `/students` and `/settings`. Student cards navigate
  to `/students/<student-id>`, which matches `app/students/[id].tsx`.
- Student details are pushed on the root stack above the tabs. The detail
  screen's back button is labeled “Students”.
- The details screen links to `/students/<student-id>/edit`. The edit form
  saves changed fields through `updateStudent` in the shared store and returns
  to that student's details.
- Both `/students/new` and `/students/<student-id>/edit` use
  `StudentForm` for the shared fields and validation.
- Student cards offer a confirmed delete action; deletions are saved with the
  rest of the persisted student state.
- Dashboard and student-card links use Expo Router's typed `Link` component.
  Dynamic student links provide the `[id]` parameter explicitly.
- `useStudentStore` shares student state between the dashboard, list, and
  detail screen. It persists student records with AsyncStorage, starts with the
  mock data in `src/data/students.ts` when no saved records exist, and exposes
  actions for adding, updating, and deleting records.
- `useStudentHydrationStore` tracks the transient loading/error state separately
  so hydration status is not written into the persisted student records.
- Screens wait for the store to hydrate before rendering student data. If
  loading saved records fails, the app logs the error and offers a retry.
- The dashboard counts unique `className` values and treats the last student in
  the store as the most recently registered one.

### Remote directory

- The Directory tab loads remote records through `src/features/directory/api.ts`.
  The API base URL can be set with `EXPO_PUBLIC_API_URL`; it defaults to
  DummyJSON.
- Search waits 400 ms after typing before requesting results. Pagination uses
  20 records per page, and changing the search starts again at page 1. The
  React Query key includes both the normalized search term and page so each
  result set is cached separately.
- Previous and Next controls use the API's `skip` and `limit` parameters.
  Changing the page or search term scrolls the list back to the top.
- Directory records have separate remote detail and edit routes. The edit form
  saves through the remote API, and Delete asks for confirmation before
  removing a record. These routes use React Query and do not read or modify the
  persisted local-student store.
