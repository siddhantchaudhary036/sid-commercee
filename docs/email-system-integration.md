# Email System Integration Guide

## Overview

The email system in CommerceOS is now fully integrated with Campaigns and Flows. Users must create email templates first before they can be used in campaigns or automated flows.

## Architecture

### 1. Email Templates (`/emails`)
**Purpose**: Central repository for all email content

**Features**:
- HTML email editor with live preview
- Template categories (Welcome, Win-back, Promotional, Transactional, General)
- System templates (read-only, can be duplicated)
- Custom templates (full CRUD operations)
- Variable support ({{firstName}}, {{lastName}}, etc.)

**Database**: `emailTemplates` table
- `userId`: Owner of the template
- `name`: Template name
- `subject`: Email subject line
- `content`: HTML email body
- `category`: Template category
- `description`: Optional description
- `isSystem`: Whether it's a system template
- `createdAt`: Creation timestamp

### 2. Email Template Selector Component
**Location**: `app/components/EmailTemplateSelector.js`

**Purpose**: Reusable component for selecting email templates

**Features**:
- Modal interface with search and filter
- Template preview
- "Create New Template" quick action
- Shows template metadata (name, category, subject, preview)
- Highlights selected template

**Usage**:
```jsx
<EmailTemplateSelector
  selectedId={templateId}
  onSelect={(templateId) => setTemplateId(templateId)}
  userId={currentUser._id}
  allowCreate={true}
/>
```

### 3. Campaign Integration
**Location**: `app/campaigns/new/page.js`

**Changes Made**:
- ❌ Removed: Subject, preheader, and content fields
- ✅ Added: Email template selector
- ✅ Preview shows selected template's content
- ✅ Variables in template are replaced with example data in preview

**Database Schema** (`campaigns` table):
```typescript
{
  name: string,
  templateId: Id<"emailTemplates">, // Reference to email template
  segmentId: Id<"segments">,
  description: string (optional),
  status: "draft" | "scheduled" | "sent",
  // ... performance metrics
}
```

**Workflow**:
1. User creates/edits campaign
2. Selects target segment
3. **Selects email template** (or creates new one)
4. Schedules or sends immediately
5. System uses template's HTML content for sending

### 4. Flow Integration (Next Step)
**Location**: `app/flows/editor/NodeConfigModal.js`

**Required Changes**:
- Add EmailTemplateSelector to email node configuration
- Store `templateId` in email node data
- When flow executes, fetch template content and send

**Email Node Structure**:
```javascript
{
  type: "email",
  data: {
    label: "Send Welcome Email",
    templateId: "...", // Reference to email template
    delay: 0,
    delayUnit: "minutes"
  }
}
```

## Data Flow

```
┌─────────────────────┐
│  Email Templates    │
│  (/emails)          │
│                     │
│  - Create HTML      │
│  - Edit & Preview   │
│  - Categorize       │
└──────────┬──────────┘
           │
           │ templateId reference
           │
           ├──────────────────────┬─────────────────────┐
           │                      │                     │
           ▼                      ▼                     ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Campaigns      │   │     Flows        │   │   Future Uses    │
│   (/campaigns)   │   │   (/flows)       │   │   - A/B Tests    │
│                  │   │                  │   │   - Triggers     │
│  - Select        │   │  - Email Nodes   │   │   - Sequences    │
│    template      │   │    use templates │   │                  │
│  - Choose        │   │  - Automated     │   │                  │
│    segment       │   │    sending       │   │                  │
│  - Schedule      │   │                  │   │                  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
           │                      │
           │                      │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │   Email Sending      │
           │   (Future: SendGrid, │
           │    Resend, etc.)     │
           │                      │
           │  - Fetch template    │
           │  - Replace variables │
           │  - Send to customers │
           └──────────────────────┘
```

## Key Benefits

### 1. **Separation of Concerns**
- Email design is separate from campaign/flow logic
- Designers can work on templates independently
- Marketers can reuse templates across campaigns

### 2. **Reusability**
- One template can be used in multiple campaigns
- One template can be used in multiple flow nodes
- Reduces duplication and ensures consistency

### 3. **Version Control**
- Templates can be updated without affecting sent campaigns
- Historical campaigns reference the template at send time
- Easy to A/B test different templates

### 4. **Workflow Efficiency**
- Create template once, use everywhere
- No need to copy/paste HTML between campaigns
- Quick campaign creation with pre-built templates

## Variable System

Templates support dynamic variables that get replaced with customer data:

**Available Variables**:
- `{{firstName}}` - Customer's first name
- `{{lastName}}` - Customer's last name
- `{{email}}` - Customer's email
- `{{totalSpent}}` - Total amount spent
- `{{loyaltyTier}}` - Customer's loyalty tier
- `{{lastOrderDate}}` - Date of last order

**Example Template**:
```html
<p>Hi {{firstName}},</p>
<p>Thanks for being a {{loyaltyTier}} member!</p>
<p>You've spent {{totalSpent}} with us.</p>
```

**Rendered Output**:
```html
<p>Hi Sarah,</p>
<p>Thanks for being a Gold member!</p>
<p>You've spent $1,234 with us.</p>
```

## Migration Notes

### Existing Campaigns
Campaigns created before this integration have `subject` and `content` fields directly. These need to be migrated:

**Migration Strategy**:
1. For each old campaign with `content`:
   - Create a new email template with that content
   - Update campaign to reference the new template
   - Remove old `subject` and `content` fields

**Migration Script** (to be created):
```typescript
// convex/migrations.ts
export const migrateCampaignsToTemplates = internalMutation({
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("campaigns").collect();
    
    for (const campaign of campaigns) {
      if (campaign.content && !campaign.templateId) {
        // Create template from campaign content
        const templateId = await ctx.db.insert("emailTemplates", {
          userId: campaign.userId,
          name: `${campaign.name} - Template`,
          subject: campaign.subject,
          content: campaign.content,
          category: "General",
          isSystem: false,
          createdAt: new Date().toISOString(),
        });
        
        // Update campaign to use template
        await ctx.db.patch(campaign._id, {
          templateId,
        });
      }
    }
  },
});
```

## Next Steps

### 1. ✅ Completed
- [x] Email template library with HTML editor
- [x] EmailTemplateSelector component
- [x] Campaign integration
- [x] Schema updates

### 2. 🚧 In Progress
- [ ] Flow editor integration (add template selector to email nodes)
- [ ] Update flow execution to use templates

### 3. 📋 Future Enhancements
- [ ] Rich text editor option (alternative to HTML)
- [ ] Template preview with real customer data
- [ ] Image upload for templates
- [ ] Template versioning
- [ ] A/B testing templates
- [ ] Template analytics (which templates perform best)
- [ ] Template marketplace (share templates)
- [ ] Email sending integration (SendGrid, Resend, etc.)

## Testing Checklist

### Email Templates
- [ ] Create new template
- [ ] Edit existing template
- [ ] Delete custom template
- [ ] Duplicate template (system and custom)
- [ ] Preview template
- [ ] Search templates
- [ ] Filter by category
- [ ] HTML renders correctly in preview

### Campaign Integration
- [ ] Create campaign with template
- [ ] Template preview shows in campaign
- [ ] Variables replaced in preview
- [ ] Save campaign with template
- [ ] Send campaign (template content used)
- [ ] Edit campaign template selection
- [ ] Campaign without template shows validation error

### Flow Integration (When Implemented)
- [ ] Add email node to flow
- [ ] Select template for email node
- [ ] Preview template in node config
- [ ] Flow execution sends correct template
- [ ] Variables replaced with customer data

## Troubleshooting

### Template not showing in selector
- Check that template belongs to current user
- Verify template is not deleted
- Check search/filter criteria

### Preview not rendering
- Verify template has valid HTML
- Check for JavaScript errors in console
- Ensure `dangerouslySetInnerHTML` is used correctly

### Variables not replacing
- Check variable syntax: `{{variableName}}`
- Verify customer has data for that field
- Check variable replacement logic in sending code

## API Reference

### Email Templates

**List Templates**:
```typescript
api.emailTemplates.list({ 
  userId: Id<"users">,
  category?: string 
})
```

**Get Template**:
```typescript
api.emailTemplates.getById({ id: Id<"emailTemplates"> })
```

**Create Template**:
```typescript
api.emailTemplates.create({
  userId: Id<"users">,
  name: string,
  subject: string,
  content: string,
  category: string,
  description?: string,
})
```

**Update Template**:
```typescript
api.emailTemplates.update({
  id: Id<"emailTemplates">,
  name?: string,
  subject?: string,
  content?: string,
  category?: string,
  description?: string,
})
```

**Delete Template**:
```typescript
api.emailTemplates.deleteTemplate({ id: Id<"emailTemplates"> })
```

**Duplicate Template**:
```typescript
api.emailTemplates.duplicate({ templateId: Id<"emailTemplates"> })
```

### Campaigns

**Create Campaign**:
```typescript
api.campaigns.create({
  userId: Id<"users">,
  name: string,
  templateId: Id<"emailTemplates">,
  segmentId?: Id<"segments">,
  description?: string,
})
```

**Update Campaign**:
```typescript
api.campaigns.update({
  id: Id<"campaigns">,
  templateId?: Id<"emailTemplates">,
  // ... other fields
})
```

---

**Last Updated**: November 20, 2025
**Status**: Campaign integration complete, Flow integration pending
