# Client Fields Update - Database Migration Instructions

## What's Been Updated

I've successfully added the following client detail fields to your License Purchase form:

### New Fields Added:
1. **Contact Person** - Text input for contact name
2. **Email** - Email input with validation
3. **Phone** - Phone number input
4. **Company** - Text input for company name
5. **Address** - Textarea for complete address
6. **GST Treatment** - Dropdown with options:
   - Registered Business - Regular
   - Registered Business - Composition
   - Unregistered Business
   - Consumer
   - Overseas
7. **Source of Supply** - Text input
8. **PAN** - 10-character input (auto-converts to uppercase)

## Files Updated

### Frontend:
- ✅ `src/components/AddLicenseModal.tsx` - Added all new input fields

### Backend:
- ✅ `api/licenses.php` - Updated to handle new fields in both POST and PUT methods
- ✅ `setup_mysql_database.sql` - Updated schema for future installations

## Database Migration Required

⚠️ **IMPORTANT**: You need to run a database migration on your cPanel MySQL database to add the new columns.

### Step 1: Access Your cPanel MySQL Database
1. Log in to your cPanel account
2. Navigate to phpMyAdmin
3. Select your database: `cybaemtechnet_LMS_Project`

### Step 2: Run the Migration SQL

Execute the following SQL query in phpMyAdmin:

```sql
ALTER TABLE license_purchases
ADD COLUMN contact_person VARCHAR(255) AFTER vendor,
ADD COLUMN email VARCHAR(255) AFTER contact_person,
ADD COLUMN phone VARCHAR(50) AFTER email,
ADD COLUMN company VARCHAR(255) AFTER phone,
ADD COLUMN address TEXT AFTER company,
ADD COLUMN gst_treatment VARCHAR(100) AFTER address,
ADD COLUMN source_of_supply VARCHAR(100) AFTER gst_treatment,
ADD COLUMN pan CHAR(10) AFTER source_of_supply;
```

**Alternative**: You can also run the migration file I created:
- File location: `add_client_fields_migration.sql`
- Copy the contents and paste into phpMyAdmin SQL tab
- Click "Go" to execute

### Step 3: Verify the Migration
After running the SQL, verify that the new columns were added:

```sql
DESCRIBE license_purchases;
```

You should see the 8 new columns listed in the table structure.

## How It Works

1. When adding a new license, users can now enter client details directly in the form
2. All fields are optional (not required)
3. The PAN field automatically converts input to uppercase and limits to 10 characters
4. GST Treatment has predefined options in a dropdown
5. Address field uses a textarea for multi-line input

## Testing

After running the migration:
1. Navigate to the Licenses page
2. Click "Add New License"
3. You should see all the new client fields in the form
4. Fill in the license details along with client information
5. Submit the form
6. The data will be saved to the database including all client details

## Notes

- These fields are stored directly in the `license_purchases` table
- They are optional and won't affect existing functionality
- The form maintains backward compatibility with existing licenses
- All new fields will be NULL for existing license records until updated

## Support

If you encounter any issues:
1. Check that the migration SQL ran successfully
2. Verify the columns exist in the database
3. Clear your browser cache and reload the page
4. Check the browser console for any errors
