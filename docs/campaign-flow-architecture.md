# Campaign & Flow Architecture

## Design Principle

**Separation of Concerns**: Segments and email templates are created independently, then combined in campaigns and flows.

## Workflow Structure

### 1. Create Building Blocks First

#### Segments (`/segments`)
- Define customer targeting criteria
- Calculate customer counts
- Reusable across campaigns and flows

#### Email Templates (`/emails`)
- Design email content with subject and body
- Support variables like `{{firstName}}`, `{{totalSpent}}`
- Reusable across campaigns and flows

### 2. Combine in Campaigns

**Campaign Creation (`/campaigns/new`)**
- Select existing segment (dropdown)
- Select existing email template (EmailTemplateSelector)
- Template content is copied to campaign (snapshot)
- No inline creation of segments or templates
- Links provided to create new segments/templates separately

**Implementation:**
- `segmentId` references the segment
- `emailTemplateId` references the original template
- `subject` and `content` are copied from template at creation

### 3. Combine in Flows

**Flow Editor (`/flows/editor`)**
- **Trigger Node**: Select segment when using "Customer Added to Segment" trigger
  - Stores `segmentId` and `segmentName` in `triggerConfig`
- **Email Nodes**: Select email template using EmailTemplateSelector
  - Stores `emailTemplateId` in node data
  - Can customize subject line per node
  - Template content is referenced, not copied
- No inline creation of segments or templates
- Links provided to edit templates in new tab

**Implementation:**
- Flow stores `triggerType` and `triggerConfig` with segment reference
- Each email node stores `emailTemplateId` and optional `customSubject`
- Flow definition stores all nodes and edges

## Key Benefits

1. **Reusability**: One segment or template can be used in multiple campaigns/flows
2. **Maintainability**: Update a template once, affects all future uses
3. **Clarity**: Clear separation between targeting (segments), content (templates), and execution (campaigns/flows)
4. **Flexibility**: Mix and match segments and templates as needed

## Current Status

✅ **Campaigns**: Correctly implemented - selects existing segments and templates
✅ **Flows**: Correctly implemented - trigger selects segment, email nodes select templates
✅ **No inline creation**: Both systems link to creation pages instead of inline forms

## User Journey

### Manual Campaign Creation
1. Go to `/segments/new` → Create segment
2. Go to `/emails/editor` → Create email template
3. Go to `/campaigns/new` → Select segment + template → Send

### Manual Flow Creation
1. Go to `/segments/new` → Create segment (if needed)
2. Go to `/emails/editor` → Create email templates (one per email node)
3. Go to `/flows/new` → Build flow:
   - Add trigger node → Select segment
   - Add email nodes → Select templates
   - Add delays/conditions as needed
   - Activate flow

### AI-Assisted Creation
- AI can create segments, templates, campaigns, and flows in one conversation
- Still follows the same architecture: creates building blocks first, then combines them
