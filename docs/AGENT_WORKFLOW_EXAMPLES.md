# Agent Workflow Examples

## How It Works

The router agent analyzes your request and creates a workflow plan with sequential steps. Each step calls a specialist agent, and data flows between them.

## Example Workflows

### 1. Simple Data Query

**Request**: "Show me customers from California"

**Workflow Plan**:
- Single agent: `customer_analyst`
- No data extraction needed

**Result**: Customer list with insights

---

### 2. Create Segment Only

**Request**: "Create a segment for VIP customers"

**Workflow Plan**:
- Single agent: `segments`
- Extracts: `segmentId`, `customerCount`

**Result**: New segment created

---

### 3. Generate Email Content

**Request**: "Write a welcome email for new customers"

**Workflow Plan**:
- Single agent: `emails`
- Extracts: `subject`, `emailBody`

**Result**: Email content generated

---

### 4. Complete Campaign Creation

**Request**: "Send a campaign to high-value customers"

**Workflow Plan**:
1. **segments** → Create segment for high LTV customers
   - Extracts: `segmentId`, `segmentName`, `customerCount`
2. **emails** → Generate promotional email
   - Extracts: `subject`, `emailBody`
3. **campaigns** → Create campaign with segment and email
   - Uses: `{{segmentId}}`, `{{subject}}`, `{{emailBody}}`
   - Extracts: `campaignId`

**Result**: Complete campaign ready to send

---

### 5. Re-engagement Campaign

**Request**: "Re-engage customers who haven't purchased in 90 days"

**Workflow Plan**:
1. **customer_analyst** → Analyze inactive customers
   - Extracts: `inactiveCount`, `avgLtv`
2. **segments** → Create inactive customer segment
   - Extracts: `segmentId`, `customerCount`
3. **emails** → Write win-back email with offer
   - Extracts: `subject`, `emailBody`
4. **campaigns** → Create win-back campaign
   - Uses: `{{segmentId}}`, `{{subject}}`, `{{emailBody}}`
   - Extracts: `campaignId`

**Result**: Win-back campaign with insights

---

### 6. Business Goal Request

**Request**: "I want to increase revenue from VIP customers"

**Workflow Plan**:
1. **customer_analyst** → Analyze VIP customer behavior
   - Extracts: `vipCount`, `avgRevenue`, `insights`
2. **segments** → Create VIP segment
   - Extracts: `segmentId`, `customerCount`
3. **emails** → Generate exclusive offer email
   - Extracts: `subject`, `emailBody`
4. **campaigns** → Create revenue-driving campaign
   - Uses: `{{segmentId}}`, `{{subject}}`, `{{emailBody}}`
   - Extracts: `campaignId`

**Result**: Revenue optimization campaign with metrics

---

## Context Passing

Data extracted from one agent is automatically available to subsequent agents:

```
Step 1: segments agent
  Output: "Created segment 'VIP Customers' with 150 customers"
  Extracted: { segmentId: "abc123", customerCount: 150 }

Step 2: emails agent
  Input: "Write email for {{customerCount}} VIP customers"
  Becomes: "Write email for 150 VIP customers"

Step 3: campaigns agent
  Input: "Create campaign for segment {{segmentId}}"
  Becomes: "Create campaign for segment abc123"
```

## Testing the System

Try these requests to see the workflow system in action:

1. **Simple**: "How many customers do I have?"
2. **Medium**: "Create a segment for customers in Texas"
3. **Complex**: "Target inactive VIP customers with a special offer"
4. **Business Goal**: "Improve retention for at-risk customers"
