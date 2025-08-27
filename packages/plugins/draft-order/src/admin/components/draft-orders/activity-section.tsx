import { HttpTypes } from "@medusajs/types"
import {
  Avatar,
  clx,
  Container,
  Heading,
  Skeleton,
  Text,
  Tooltip,
} from "@medusajs/ui"
import { Collapsible } from "radix-ui"
import { ReactNode, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useUser } from "../../hooks/api/users"
import { getFullDate, getRelativeDate } from "../../lib/utils/date-utils"

interface ActivitySectionProps {
  order: HttpTypes.AdminOrder
  changes: HttpTypes.AdminOrderChange[]
}

export const ActivitySection = ({ order, changes }: ActivitySectionProps) => {
  const activityItems = useMemo(
    () => getActivityItems(order, changes),
    [order, changes]
  )

  return (
    <Container className="p-0 overflow-hidden">
      <div className="px-6 py-4">
        <Heading>Activity</Heading>
      </div>
      <ActivityItemList items={activityItems} />
    </Container>
  )
}

interface ActivityItemListProps {
  items: ActivityItem[]
}

const ActivityItemList = ({ items }: ActivityItemListProps) => {
  if (items.length <= 3) {
    return (
      <div className="flex flex-col gap-y-0.5 px-6 pb-6">
        {items.map((item, idx) => (
          <ActivityItem
            key={idx}
            item={item}
            isFirst={idx === items.length - 1}
          />
        ))}
      </div>
    )
  }

  const lastItems = items.slice(0, 2)
  const collapsibleItems = items.slice(2, items.length - 1)
  const firstItem = items[items.length - 1]

  return (
    <div className="flex flex-col gap-y-0.5 px-6 pb-6">
      {lastItems.map((item, idx) => (
        <ActivityItem key={idx} item={item} />
      ))}
      <CollapsibleActivityItemList items={collapsibleItems} />
      <ActivityItem key={items.length - 1} item={firstItem} isFirst />
    </div>
  )
}

interface CollapsibleActivityItemListProps {
  items: ActivityItem[]
}

const CollapsibleActivityItemList = ({
  items,
}: CollapsibleActivityItemListProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      {!open && (
        <div className="grid grid-cols-[20px_1fr] items-start gap-2">
          <div className="flex size-full flex-col items-center">
            <div className="border-ui-border-strong w-px flex-1 bg-[linear-gradient(var(--border-strong)_33%,rgba(255,255,255,0)_0%)] bg-[length:1px_3px] bg-right bg-repeat-y bg-clip-content" />
          </div>
          <Collapsible.Trigger className="text-left p-0 m-0 pb-4 text-ui-fg-muted hover:text-ui-fg-base focus:text-ui-fg-base outline-none transition-colors">
            <Text size="small" leading="compact" weight="plus">
              {`Show ${items.length} more ${
                items.length === 1 ? "activity" : "activities"
              }`}
            </Text>
          </Collapsible.Trigger>
        </div>
      )}
      <Collapsible.Content>
        <div className="flex flex-col gap-y-0.5">
          {items.map((item, idx) => {
            return <ActivityItem key={idx} item={item} />
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

interface ActivityItem {
  label: string
  content?: ReactNode
  timestamp: string
  userId?: string | null
}

interface ActivityItemProps {
  item: ActivityItem
  isFirst?: boolean
}

const ActivityItem = ({ item, isFirst = false }: ActivityItemProps) => {
  const { user, isPending, isError, error } = useUser(item.userId!, undefined, {
    enabled: !!item.userId,
  })

  if (isError) {
    throw error
  }

  const isUserLoaded = !isPending && !!user && !!item.userId

  return (
    <div
      className={clx("grid grid-cols-[20px_1fr] items-start gap-x-2 w-full")}
    >
      <div className="flex flex-col items-center gap-0.5 h-full">
        <div className="size-5 flex items-center justify-center">
          <div className="size-2.5 rounded-full shadow-borders-base flex items-center justify-center">
            <div className="size-1.5 rounded-full bg-ui-tag-neutral-icon" />
          </div>
        </div>
        {!isFirst && (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-full w-px bg-ui-border-base" />
          </div>
        )}
      </div>
      <div className={clx("flex flex-col", !isFirst && "pb-4")}>
        <div className="flex items-center gap-x-2 justify-between">
          <Text size="small" weight="plus" leading="compact">
            {item.label}
          </Text>
          <Tooltip
            content={getFullDate({ date: item.timestamp, includeTime: true })}
          >
            <Text size="small" leading="compact" className="cursor-default">
              {getRelativeDate(item.timestamp)}
            </Text>
          </Tooltip>
        </div>
        {item.content && renderContent(item.content)}
        {item.userId && (
          <div className="pt-2 text-ui-fg-muted">
            {isUserLoaded ? (
              <Link to={`/settings/users/${user.id}`} className="w-fit">
                <div className="flex items-center gap-x-1.5 w-fit">
                  <Text size="small">By</Text>
                  <Avatar
                    size="2xsmall"
                    fallback={[user.first_name, user.last_name]
                      .filter(Boolean)
                      .join("")
                      .slice(0, 1)}
                  />
                  <Text size="small">
                    {user.first_name} {user.last_name}
                  </Text>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-x-1.5">
                <Text size="small">By</Text>
                <Skeleton className="rounded-full w-5 h-5" />
                <Skeleton className="w-[75px] h-4" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function renderContent(content: ReactNode) {
  if (typeof content === "string") {
    return (
      <Text size="small" className="text-ui-fg-subtle">
        {content}
      </Text>
    )
  }

  return content
}

function getEditActivityItems(
  change: HttpTypes.AdminOrderChange
): ActivityItem[] {
  const activityItems: ActivityItem[] = []
  const counts = {
    itemsAdded: 0,
    itemsRemoved: 0,
    shippingMethodsAdded: 0,
    shippingMethodsRemoved: 0,
    promotionsAdded: 0,
    promotionsRemoved: 0,
  }

  for (const action of change.actions) {
    if (!action.details) {
      continue
    }

    switch (action.action) {
      case "ITEM_ADD":
        counts.itemsAdded += action.details.quantity as number
        break
      case "ITEM_UPDATE":
        const diff = action.details.quantity_diff as number
        diff > 0 ? (counts.itemsAdded += diff) : (counts.itemsRemoved += diff)
        break
      case "SHIPPING_ADD":
        counts.shippingMethodsAdded += 1
        break
      case "SHIPPING_REMOVE":
        counts.shippingMethodsRemoved += 1
        break
      case "PROMOTION_ADD":
        counts.promotionsAdded += 1
        break
      case "PROMOTION_REMOVE":
        counts.promotionsRemoved += 1
        break
    }
  }

  const createActivityItem = (
    type: "items" | "shipping" | "promotions",
    added: number,
    removed: number
  ) => {
    if (added === 0 && removed === 0) return

    const getText = (count: number, singular: string, plural: string) =>
      count === 1 ? `${count} ${singular}` : `${count} ${plural}`

    const addedText = getText(
      added,
      type === "items"
        ? "item"
        : type === "shipping"
        ? "shipping method"
        : "promotion",
      type === "items"
        ? "items"
        : type === "shipping"
        ? "shipping methods"
        : "promotions"
    )
    const removedText = getText(
      Math.abs(removed),
      type === "items"
        ? "item"
        : type === "shipping"
        ? "shipping method"
        : "promotion",
      type === "items"
        ? "items"
        : type === "shipping"
        ? "shipping methods"
        : "promotions"
    )

    const content =
      added && removed
        ? `Added ${addedText}, removed ${removedText}`
        : added
        ? `Added ${addedText}`
        : `Removed ${removedText}`

    const label =
      added && removed
        ? `${
            type === "items"
              ? "Items"
              : type === "shipping"
              ? "Shipping methods"
              : "Promotions"
          } updated`
        : added
        ? `${
            type === "items"
              ? "Items"
              : type === "shipping"
              ? "Shipping methods"
              : "Promotions"
          } added`
        : `${
            type === "items"
              ? "Items"
              : type === "shipping"
              ? "Shipping methods"
              : "Promotions"
          } removed`

    activityItems.push({
      label,
      content,
      timestamp: new Date(change.created_at).toISOString(),
      userId: change.confirmed_by,
    })
  }

  createActivityItem("items", counts.itemsAdded, counts.itemsRemoved)
  createActivityItem(
    "shipping",
    counts.shippingMethodsAdded,
    counts.shippingMethodsRemoved
  )
  createActivityItem(
    "promotions",
    counts.promotionsAdded,
    counts.promotionsRemoved
  )

  return activityItems
}

function getTransferActivityItem(change: HttpTypes.AdminOrderChange) {
  return {
    label: "Transferred",
    content: "Draft order transferred",
    timestamp: new Date(change.created_at).toISOString(),
  }
}

function getUpdateOrderActivityItem(change: HttpTypes.AdminOrderChange) {
  const { details } = change.actions?.[0] || {}

  if (!details) {
    return null
  }

  switch (details.type) {
    case "customer_id":
      return {
        label: "Customer updated",
        timestamp: new Date(change.created_at).toISOString(),
        userId: change.confirmed_by,
      }
    case "sales_channel_id":
      return {
        label: "Sales channel updated",
        timestamp: new Date(change.created_at).toISOString(),
        userId: change.confirmed_by,
      }
    case "billing_address":
      return {
        label: "Billing address updated",
        timestamp: new Date(change.created_at).toISOString(),
        userId: change.confirmed_by,
      }
    case "shipping_address":
      return {
        label: "Shipping address updated",
        timestamp: new Date(change.created_at).toISOString(),
        userId: change.confirmed_by,
      }
    case "email":
      return {
        label: "Email updated",
        timestamp: new Date(change.created_at).toISOString(),
        userId: change.confirmed_by,
      }

    default:
      return null
  }
}

function getActivityItems(
  order: HttpTypes.AdminOrder,
  changes: HttpTypes.AdminOrderChange[]
) {
  const items: ActivityItem[] = []

  if (order.created_at) {
    items.push({
      label: "Created",
      content: "Draft order created",
      timestamp: new Date(order.created_at).toISOString(),
    })
  }

  changes.forEach((change) => {
    if (!change.change_type || !change.confirmed_at) {
      return
    }

    switch (change.change_type) {
      case "edit": {
        items.push(...getEditActivityItems(change))
        break
      }
      case "transfer":
        items.push(getTransferActivityItem(change))
        break
      case "update_order": {
        const item = getUpdateOrderActivityItem(change)

        if (item) {
          items.push(item)
        }
        break
      }
      default:
        break
    }
  })

  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}
