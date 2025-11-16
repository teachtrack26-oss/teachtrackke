# School Settings Implementation Guide

## Overview

Comprehensive school configuration system allowing admins to set up school information, terms, and calendar activities.

## Features Implemented

### 1. School Settings Page (`/admin/school-settings`)

- **Basic Information**:
  - School name, email, phone, address
  - School type (Public, Private, Government, Faith-Based, County)
  - County and Sub-County
  - Principal and Deputy Principal names
  - School motto
  - Established year
- **Logo Management**:

  - Upload school logo (PNG, JPG, SVG)
  - Max file size: 2MB
  - Logo preview
  - Stored in `/uploads/logos/`

- **Grades & Streams**:
  - Select offered grades (PP1-Grade 12)
  - Configure streams per grade
  - Dynamic stream management (add/remove)

### 2. School Terms Configuration

- Three terms per academic year
- Configure for each term:
  - Term number (1, 2, 3)
  - Year
  - Start date and End date
  - Mid-term break dates (optional)
- Edit/Delete functionality

### 3. Calendar of Activities

- Per-term activity management
- Activity types:
  - Opening Day
  - Closing Day
  - Mid-Term Break
  - Exam Week
  - Sports Day
  - Parents Day
  - KCPE/KCSE
  - Holiday
  - Staff Meeting
  - Other
- Fields:
  - Activity name
  - Date
  - Type
  - Description (optional)

## Database Schema

### Tables Created

1. **school_settings**: Main school configuration
2. **school_terms**: Academic terms configuration
3. **calendar_activities**: School calendar events

See `database/add_school_settings.sql` for full schema.

## API Endpoints

### School Settings

- `GET /api/v1/admin/school-settings` - Get settings
- `POST /api/v1/admin/school-settings` - Create settings
- `PUT /api/v1/admin/school-settings/:id` - Update settings
- `POST /api/v1/admin/upload-logo` - Upload school logo

### School Terms

- `GET /api/v1/admin/school-terms` - Get all terms
- `POST /api/v1/admin/school-terms` - Create term
- `PUT /api/v1/admin/school-terms/:id` - Update term
- `DELETE /api/v1/admin/school-terms/:id` - Delete term

### Calendar Activities

- `GET /api/v1/admin/calendar-activities` - Get all activities
- `POST /api/v1/admin/calendar-activities` - Create activity
- `PUT /api/v1/admin/calendar-activities/:id` - Update activity
- `DELETE /api/v1/admin/calendar-activities/:id` - Delete activity

## Setup Instructions

### 1. Apply Database Migration

```bash
# Run the migration script
mysql -u your_username -p your_database < database/add_school_settings.sql

# Or if using docker-compose:
docker-compose exec db mysql -u root -p teachtrack_db < database/add_school_settings.sql
```

### 2. Create Uploads Directory

```bash
mkdir -p backend/uploads/logos
```

### 3. Restart Backend

```bash
cd backend
python main.py
# Or if using docker:
docker-compose restart backend
```

### 4. Test the Feature

1. Login as admin
2. Navigate to Admin Dashboard
3. Click "School Settings" button
4. Fill in school information
5. Configure terms and calendar

## Usage Flow

### First-Time Setup

1. **Basic Information**: Fill in school details, upload logo
2. **Grades & Streams**: Select grades offered and configure streams
3. **Save Settings**
4. **Configure Terms**: Add Term 1, 2, and 3 with dates
5. **Calendar Activities**: Add important dates per term

### Updating Settings

- Settings can be updated anytime
- Logo can be re-uploaded (old logo remains until overwritten)
- Terms can be edited or deleted
- Activities can be added/modified throughout the year

## Integration Points

The school settings will be used throughout the application:

### 1. Lesson Plan Generation

- Use school name and logo in headers
- Reference terms for date ranges
- Include school motto

### 2. Scheme of Work

- Distribute lessons across configured terms
- Account for mid-term breaks
- Align with calendar activities

### 3. Reports & Exports

- Include school branding (logo, name)
- Reference term dates
- Show calendar context

### 4. Navigation & Branding

- Display school logo in navbar
- Show school name in footer
- Custom branding per school

### 5. Timetable Integration

- Align with term dates
- Account for holidays/activities
- Show relevant calendar events

## Future Enhancements

### Phase 2 (Recommended)

- [ ] School website URL field
- [ ] Multiple contact persons
- [ ] School colors configuration
- [ ] Term auto-generation based on pattern
- [ ] Import/export calendar activities (CSV/Excel)
- [ ] Academic calendar visualization (calendar view)
- [ ] Email reminders for upcoming activities
- [ ] Integration with national exam schedules

### Phase 3 (Advanced)

- [ ] Multi-campus support
- [ ] Historical data tracking
- [ ] School performance metrics
- [ ] Custom activity types
- [ ] Recurring events
- [ ] iCal export
- [ ] Mobile calendar sync

## Security Notes

- All endpoints require admin authentication
- Logo uploads validated for file type and size
- SQL injection protection via SQLAlchemy ORM
- Cascade deletes configured for data integrity

## Troubleshooting

### Logo Not Uploading

- Check `backend/uploads/logos` directory exists
- Verify write permissions
- Check file size < 2MB
- Ensure valid image format

### Terms Not Saving

- Verify dates are in YYYY-MM-DD format
- Check term_number is 1, 2, or 3
- Ensure year is valid integer

### Activities Not Showing

- Verify term_id exists in school_terms table
- Check activity_date format
- Ensure term is associated with activity

## Testing Checklist

- [ ] Create school settings
- [ ] Upload school logo
- [ ] Update school settings
- [ ] Add all three terms
- [ ] Edit term dates
- [ ] Delete a term
- [ ] Add activities to each term
- [ ] Edit activity details
- [ ] Delete an activity
- [ ] Verify logo displays correctly
- [ ] Test with different school types
- [ ] Configure 10+ grades with multiple streams
- [ ] Test mid-term break dates

## Support

For issues or questions:

1. Check database migration ran successfully
2. Verify backend server is running
3. Check browser console for errors
4. Review backend logs for API errors
5. Ensure admin user has proper permissions

---

**Status**: ✅ Fully Implemented
**Version**: 1.0.0
**Last Updated**: 2024
