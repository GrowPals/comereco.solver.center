# Mobile-First Form Patterns

This document provides examples and best practices for using the mobile-first form components.

## Components Overview

### Core Components
- **FormContainer**: Main form wrapper with responsive layout
- **FormContent**: Scrollable content area for form fields
- **FormHeader**: Header section with title, description, and icon
- **FormActions**: Sticky action buttons at bottom
- **FormField**: Input/textarea with floating labels
- **FormSection**: Groups related fields with headers
- **FormProgress**: Multi-step form progress indicator
- **FormGrid**: Responsive grid layout for fields

## Basic Form Example

```jsx
import {
  FormContainer,
  FormContent,
  FormHeader,
  FormActions,
  FormField,
  FormSection,
  FormGrid
} from '@/components/ui/form-container'
import { Mail, User, Building } from 'lucide-react'

function SimpleForm() {
  return (
    <FormContainer variant="card" maxWidth="2xl" hasStickyFooter>
      <FormHeader
        title="Create New Product"
        description="Fill in the details below to add a new product to the catalog"
        icon={<Package />}
      />

      <FormContent>
        <FormSection
          title="Basic Information"
          description="Essential product details"
          icon={<Info />}
        >
          <FormField
            name="name"
            label="Product Name"
            required
            placeholder="e.g., Office Desk"
            icon={<Package />}
          />

          <FormGrid columns={2}>
            <FormField
              name="sku"
              label="SKU"
              required
              placeholder="e.g., DESK-001"
            />
            <FormField
              name="price"
              label="Price"
              type="number"
              required
              icon={<DollarSign />}
            />
          </FormGrid>

          <FormField
            name="description"
            label="Description"
            multiline
            rows={4}
            helperText="Provide a detailed description of the product"
          />
        </FormSection>

        <FormSectionDivider />

        <FormSection
          title="Inventory"
          description="Stock and availability"
          icon={<Package />}
        >
          <FormGrid columns={2}>
            <FormField
              name="stock"
              label="Stock Quantity"
              type="number"
              required
            />
            <FormField
              name="category"
              label="Category"
              required
            />
          </FormGrid>
        </FormSection>
      </FormContent>

      <FormActions
        primaryAction={{
          label: 'Create Product',
          onClick: handleSubmit
        }}
        secondaryAction={{
          label: 'Save as Draft',
          onClick: handleSaveDraft
        }}
        cancelAction={{
          label: 'Cancel',
          onClick: handleCancel
        }}
      />
    </FormContainer>
  )
}
```

## Multi-Step Form Example

```jsx
import { FormProgress } from '@/components/ui/form-progress'
import { useState } from 'react'

function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { id: 'general', label: 'General Data', description: 'Basic info' },
    { id: 'items', label: 'Items', description: 'Add products' },
    { id: 'review', label: 'Review', description: 'Confirm details' }
  ]

  return (
    <FormContainer variant="default" maxWidth="2xl" hasStickyFooter>
      <FormHeader>
        <FormProgress steps={steps} currentStep={currentStep} />
      </FormHeader>

      <FormContent>
        {currentStep === 0 && (
          <FormSection title="General Information">
            <FormField
              name="title"
              label="Requisition Title"
              required
              placeholder="e.g., Office Supplies Q4"
            />
            <FormField
              name="description"
              label="Description"
              multiline
              rows={3}
            />
          </FormSection>
        )}

        {currentStep === 1 && (
          <FormSection title="Add Items">
            {/* Items selection UI */}
          </FormSection>
        )}

        {currentStep === 2 && (
          <FormSection title="Review & Submit">
            {/* Review summary */}
          </FormSection>
        )}
      </FormContent>

      <FormActions
        primaryAction={{
          label: currentStep === steps.length - 1 ? 'Submit' : 'Next',
          onClick: () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
        }}
        secondaryAction={currentStep > 0 ? {
          label: 'Back',
          onClick: () => setCurrentStep(prev => Math.max(prev - 1, 0))
        } : undefined}
      />
    </FormContainer>
  )
}
```

## Form Field States

```jsx
// Error state
<FormField
  name="email"
  label="Email"
  type="email"
  error="Invalid email format"
  icon={<Mail />}
/>

// Success state
<FormField
  name="username"
  label="Username"
  success
  helperText="Username is available"
  icon={<User />}
/>

// Disabled state
<FormField
  name="company"
  label="Company"
  disabled
  value="ACME Corp"
  icon={<Building />}
/>
```

## Responsive Grid Layouts

```jsx
// 2 columns on tablet+
<FormGrid columns={2}>
  <FormField name="firstName" label="First Name" required />
  <FormField name="lastName" label="Last Name" required />
</FormGrid>

// 3 columns on desktop
<FormGrid columns={3}>
  <FormField name="city" label="City" />
  <FormField name="state" label="State" />
  <FormField name="zip" label="ZIP Code" />
</FormGrid>

// Single column (full width)
<FormGrid columns={1}>
  <FormField name="address" label="Street Address" />
</FormGrid>
```

## Best Practices

### Mobile-First Design
1. **Full-width fields**: All inputs are 100% width by default
2. **Floating labels**: Save vertical space and provide context
3. **Sticky actions**: Keep buttons accessible while scrolling
4. **Touch-friendly**: 44px minimum touch target size

### Accessibility
1. **Required fields**: Use the `required` prop and visual indicator (*)
2. **Error messages**: Provide clear, actionable error messages
3. **Helper text**: Guide users with helpful hints
4. **Labels**: Always include labels, never rely on placeholder alone

### Performance
1. **Debounce validation**: Don't validate on every keystroke
2. **Lazy sections**: Load heavy sections only when needed
3. **Optimistic updates**: Show success immediately for better UX

### Visual Hierarchy
1. **Group related fields**: Use FormSection for logical grouping
2. **Section dividers**: Separate major sections visually
3. **Grid layouts**: Use FormGrid for related fields (name/surname)
4. **Icons**: Add icons to important fields for quick scanning

## Component Props Reference

### FormContainer
- `variant`: "default" | "card" | "flat"
- `maxWidth`: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
- `hasStickyFooter`: boolean
- `onSubmit`: (e) => void

### FormField
- `label`: string
- `type`: "text" | "email" | "password" | "number" | etc.
- `required`: boolean
- `disabled`: boolean
- `error`: string
- `success`: boolean
- `helperText`: string
- `icon`: ReactElement
- `multiline`: boolean
- `rows`: number
- `placeholder`: string

### FormSection
- `title`: string
- `description`: string
- `icon`: ReactElement

### FormActions
- `sticky`: boolean
- `primaryAction`: { label, onClick, disabled, isLoading }
- `secondaryAction`: { label, onClick, disabled }
- `cancelAction`: { label, onClick }

### FormProgress
- `steps`: Array<{ id, label, description? }>
- `currentStep`: number

## Integration with React Hook Form

```jsx
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/ui/form-field'

function FormWithValidation() {
  const { register, handleSubmit, formState: { errors } } = useForm()

  return (
    <FormContainer onSubmit={handleSubmit(onSubmit)}>
      <FormContent>
        <FormField
          label="Email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          error={errors.email?.message}
        />
      </FormContent>

      <FormActions
        primaryAction={{ label: 'Submit' }}
      />
    </FormContainer>
  )
}
```

## Migration Guide

### Before (Old Pattern)
```jsx
<div className="space-y-4">
  <div>
    <Label htmlFor="name">Name</Label>
    <Input id="name" {...register('name')} />
    {errors.name && <p className="text-destructive">{errors.name.message}</p>}
  </div>
</div>
```

### After (New Pattern)
```jsx
<FormField
  name="name"
  label="Name"
  {...register('name')}
  error={errors.name?.message}
/>
```

Benefits:
- ✅ Consistent styling
- ✅ Built-in floating labels
- ✅ Mobile-optimized
- ✅ Less boilerplate
- ✅ Better accessibility
