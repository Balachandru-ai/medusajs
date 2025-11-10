import { Migration } from '@mikro-orm/migrations';

export class Migration20251110153514 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "order" add column if not exists "custom_display_id" text null;`);
    this.addSql(`alter table if exists "order" alter column "is_draft_order" drop default;`);
    this.addSql(`alter table if exists "order" alter column "is_draft_order" type boolean using ("is_draft_order"::boolean);`);

    this.addSql(`alter table if exists "order_change_action" alter column "applied" drop default;`);
    this.addSql(`alter table if exists "order_change_action" alter column "applied" type boolean using ("applied"::boolean);`);

    this.addSql(`alter table if exists "order_line_item" alter column "is_giftcard" drop default;`);
    this.addSql(`alter table if exists "order_line_item" alter column "is_giftcard" type boolean using ("is_giftcard"::boolean);`);
    this.addSql(`alter table if exists "order_line_item" alter column "is_tax_inclusive" drop default;`);
    this.addSql(`alter table if exists "order_line_item" alter column "is_tax_inclusive" type boolean using ("is_tax_inclusive"::boolean);`);
    this.addSql(`alter table if exists "order_line_item" alter column "is_custom_price" drop default;`);
    this.addSql(`alter table if exists "order_line_item" alter column "is_custom_price" type boolean using ("is_custom_price"::boolean);`);

    this.addSql(`alter table if exists "order_item" alter column "raw_fulfilled_quantity" type jsonb using ("raw_fulfilled_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_fulfilled_quantity" set default '{"value":"0","precision":20}';`);
    this.addSql(`alter table if exists "order_item" alter column "raw_delivered_quantity" type jsonb using ("raw_delivered_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_delivered_quantity" set default '{"value":"0","precision":20}';`);
    this.addSql(`alter table if exists "order_item" alter column "raw_shipped_quantity" type jsonb using ("raw_shipped_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_shipped_quantity" set default '{"value":"0","precision":20}';`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_requested_quantity" type jsonb using ("raw_return_requested_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_requested_quantity" set default '{"value":"0","precision":20}';`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_received_quantity" type jsonb using ("raw_return_received_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_received_quantity" set default '{"value":"0","precision":20}';`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_dismissed_quantity" type jsonb using ("raw_return_dismissed_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_dismissed_quantity" set default '{"value":"0","precision":20}';`);
    this.addSql(`alter table if exists "order_item" alter column "raw_written_off_quantity" type jsonb using ("raw_written_off_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_written_off_quantity" set default '{"value":"0","precision":20}';`);

    this.addSql(`alter table if exists "order_line_item_adjustment" alter column "is_tax_inclusive" drop default;`);
    this.addSql(`alter table if exists "order_line_item_adjustment" alter column "is_tax_inclusive" type boolean using ("is_tax_inclusive"::boolean);`);

    this.addSql(`alter table if exists "order_shipping_method" alter column "is_tax_inclusive" drop default;`);
    this.addSql(`alter table if exists "order_shipping_method" alter column "is_tax_inclusive" type boolean using ("is_tax_inclusive"::boolean);`);
    this.addSql(`alter table if exists "order_shipping_method" alter column "is_custom_amount" drop default;`);
    this.addSql(`alter table if exists "order_shipping_method" alter column "is_custom_amount" type boolean using ("is_custom_amount"::boolean);`);

    this.addSql(`alter table if exists "order_exchange" alter column "allow_backorder" drop default;`);
    this.addSql(`alter table if exists "order_exchange" alter column "allow_backorder" type boolean using ("allow_backorder"::boolean);`);

    this.addSql(`alter table if exists "order_claim_item" alter column "is_additional_item" drop default;`);
    this.addSql(`alter table if exists "order_claim_item" alter column "is_additional_item" type boolean using ("is_additional_item"::boolean);`);

    this.addSql(`alter table if exists "return_item" alter column "raw_received_quantity" type jsonb using ("raw_received_quantity"::jsonb);`);
    this.addSql(`alter table if exists "return_item" alter column "raw_received_quantity" set default '{"value":"0","precision":20}';`);
    this.addSql(`alter table if exists "return_item" alter column "raw_damaged_quantity" type jsonb using ("raw_damaged_quantity"::jsonb);`);
    this.addSql(`alter table if exists "return_item" alter column "raw_damaged_quantity" set default '{"value":"0","precision":20}';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "order" drop column if exists "custom_display_id";`);

    this.addSql(`alter table if exists "order" alter column "is_draft_order" type boolean using ("is_draft_order"::boolean);`);
    this.addSql(`alter table if exists "order" alter column "is_draft_order" set default false;`);

    this.addSql(`alter table if exists "order_change_action" alter column "applied" type boolean using ("applied"::boolean);`);
    this.addSql(`alter table if exists "order_change_action" alter column "applied" set default false;`);

    this.addSql(`alter table if exists "order_line_item" alter column "is_giftcard" type boolean using ("is_giftcard"::boolean);`);
    this.addSql(`alter table if exists "order_line_item" alter column "is_giftcard" set default false;`);
    this.addSql(`alter table if exists "order_line_item" alter column "is_tax_inclusive" type boolean using ("is_tax_inclusive"::boolean);`);
    this.addSql(`alter table if exists "order_line_item" alter column "is_tax_inclusive" set default false;`);
    this.addSql(`alter table if exists "order_line_item" alter column "is_custom_price" type boolean using ("is_custom_price"::boolean);`);
    this.addSql(`alter table if exists "order_line_item" alter column "is_custom_price" set default false;`);

    this.addSql(`alter table if exists "order_item" alter column "raw_fulfilled_quantity" drop default;`);
    this.addSql(`alter table if exists "order_item" alter column "raw_fulfilled_quantity" type jsonb using ("raw_fulfilled_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_delivered_quantity" drop default;`);
    this.addSql(`alter table if exists "order_item" alter column "raw_delivered_quantity" type jsonb using ("raw_delivered_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_shipped_quantity" drop default;`);
    this.addSql(`alter table if exists "order_item" alter column "raw_shipped_quantity" type jsonb using ("raw_shipped_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_requested_quantity" drop default;`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_requested_quantity" type jsonb using ("raw_return_requested_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_received_quantity" drop default;`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_received_quantity" type jsonb using ("raw_return_received_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_dismissed_quantity" drop default;`);
    this.addSql(`alter table if exists "order_item" alter column "raw_return_dismissed_quantity" type jsonb using ("raw_return_dismissed_quantity"::jsonb);`);
    this.addSql(`alter table if exists "order_item" alter column "raw_written_off_quantity" drop default;`);
    this.addSql(`alter table if exists "order_item" alter column "raw_written_off_quantity" type jsonb using ("raw_written_off_quantity"::jsonb);`);

    this.addSql(`alter table if exists "order_line_item_adjustment" alter column "is_tax_inclusive" type boolean using ("is_tax_inclusive"::boolean);`);
    this.addSql(`alter table if exists "order_line_item_adjustment" alter column "is_tax_inclusive" set default false;`);

    this.addSql(`alter table if exists "order_shipping_method" alter column "is_tax_inclusive" type boolean using ("is_tax_inclusive"::boolean);`);
    this.addSql(`alter table if exists "order_shipping_method" alter column "is_tax_inclusive" set default false;`);
    this.addSql(`alter table if exists "order_shipping_method" alter column "is_custom_amount" type boolean using ("is_custom_amount"::boolean);`);
    this.addSql(`alter table if exists "order_shipping_method" alter column "is_custom_amount" set default false;`);

    this.addSql(`alter table if exists "order_exchange" alter column "allow_backorder" type boolean using ("allow_backorder"::boolean);`);
    this.addSql(`alter table if exists "order_exchange" alter column "allow_backorder" set default false;`);

    this.addSql(`alter table if exists "order_claim_item" alter column "is_additional_item" type boolean using ("is_additional_item"::boolean);`);
    this.addSql(`alter table if exists "order_claim_item" alter column "is_additional_item" set default false;`);

    this.addSql(`alter table if exists "return_item" alter column "raw_received_quantity" drop default;`);
    this.addSql(`alter table if exists "return_item" alter column "raw_received_quantity" type jsonb using ("raw_received_quantity"::jsonb);`);
    this.addSql(`alter table if exists "return_item" alter column "raw_damaged_quantity" drop default;`);
    this.addSql(`alter table if exists "return_item" alter column "raw_damaged_quantity" type jsonb using ("raw_damaged_quantity"::jsonb);`);
  }

}
