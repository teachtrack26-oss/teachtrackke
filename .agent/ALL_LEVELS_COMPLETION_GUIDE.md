# Completing the "All Levels" Feature

## ✅ What's Been Completed

1. `AllLevelsListView` component created at `frontend/components/timetable/AllLevelsListView.tsx`
2. Backend logic in `loadData()` handles "All Levels" selection
3. State management updated (allTimeSlots added)
4. Default view set to "All Levels"
5. Variable conflict resolved

## 📋 What You Need to Add

The current timetable page file appears to be an older version without the full UI. Here's what needs to be added:

### 1. Education Level Selector Buttons

Add this after the header section (around line 1040):

```typescript
{/* Education Level Selector */}
<div className="mb-6">
  <div className="flex flex-wrap gap-3">
    {/* All Levels Button */}
    <button
      onClick={() => setSelectedViewLevel("All Levels")}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
        selectedViewLevel === "All Levels"
          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105"
          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
      }`}
    >
      📚 All Levels
    </button>

    {/* Other Level Buttons */}
    {Object.keys(educationLevels).map((level) => (
      <button
        key={level}
        onClick={() => setSelectedViewLevel(level)}
        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
          selectedViewLevel === level
            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105"
            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
        }`}
      >
        {level}
      </button>
    ))}
  </div>
</div>
```

### 2. Conditional Rendering for List vs Grid View

Where the timetable table/grid would be rendered:

```typescript
{/* Timetable Display */}
{selectedViewLevel === "All Levels" ? (
  // List View for All Levels
  <AllLevelsListView
    entries={entries}
    subjects={subjects}
    timeSlots={allTimeSlots}
    onEdit={openEditModal}
    onDelete={handleDelete}
  />
) : (
  // Grid View for Single Level
  <DndContext onDragEnd={handleDragEnd}>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Your existing timetable grid code here */}
      {/* Table with days, time slots, draggable lessons, etc. */}
    </div>
  </DndContext>
)}
```

### 3. Quick Implementation Steps

1. Open `frontend/app/timetable/page.tsx`
2. Find the section after the header (around where schedule info is displayed)
3. Add the Education Level Selector buttons
4. Find where the timetable grid/table is rendered
5. Wrap it in the conditional rendering (selectedViewLevel === "All Levels" ?)

## 🎯 Expected Behavior

- **On page load**: Shows "All Levels" view with all lessons in a list
- **Click "All Levels"**: Shows list view of all lessons across all levels
- **Click specific level (e.g., "Upper Primary")**: Shows grid view for just that level
- **Edit/Delete buttons**: Work in both views

## 🔧 Testing

1. Refresh the timetable page
2. Should see "All Levels" selected by default
3. Should see a chronological list of all your lessons
4. Click a specific level → Should switch to grid view
5. Click "All Levels" → Should switch back to list view

The core logic is complete - just needs the UI buttons and conditional rendering!
