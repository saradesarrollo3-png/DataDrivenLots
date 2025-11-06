
CREATE TABLE "traceability_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"event_type" text NOT NULL,
	"from_stage" "batch_status",
	"to_stage" "batch_status",
	"input_batch_ids" text,
	"input_batch_codes" text,
	"output_batch_id" varchar,
	"output_batch_code" text,
	"input_quantities" text,
	"output_quantity" numeric(10, 2),
	"output_unit" text,
	"supplier_id" varchar,
	"supplier_name" text,
	"product_id" varchar,
	"product_name" text,
	"package_type" text,
	"quality_check_id" varchar,
	"quality_approved" integer,
	"shipment_id" varchar,
	"shipment_code" text,
	"customer_id" varchar,
	"customer_name" text,
	"delivery_note" text,
	"temperature" numeric(5, 2),
	"notes" text,
	"performed_by" varchar,
	"performed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);

ALTER TABLE "traceability_events" ADD CONSTRAINT "traceability_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "traceability_events" ADD CONSTRAINT "traceability_events_output_batch_id_batches_id_fk" FOREIGN KEY ("output_batch_id") REFERENCES "batches"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "traceability_events" ADD CONSTRAINT "traceability_events_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "traceability_events" ADD CONSTRAINT "traceability_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "traceability_events" ADD CONSTRAINT "traceability_events_quality_check_id_quality_checks_id_fk" FOREIGN KEY ("quality_check_id") REFERENCES "quality_checks"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "traceability_events" ADD CONSTRAINT "traceability_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "traceability_events" ADD CONSTRAINT "traceability_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "traceability_events" ADD CONSTRAINT "traceability_events_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
