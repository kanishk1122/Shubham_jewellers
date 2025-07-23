import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Customer from "@/models/Customer";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { customers, options = {} } = body;
    const {
      skipDuplicates = false,
      updateExisting = false,
      duplicateCheckField = "phone", // 'phone', 'email', or 'both'
    } = options;

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No customers data provided",
        },
        { status: 400 }
      );
    }

    const results = {
      successful: 0,
      failed: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      created: [] as any[],
      duplicates: [] as string[],
    };

    for (let i = 0; i < customers.length; i++) {
      const customerData = customers[i];

      try {
        // Validate required fields
        if (!customerData.name || !customerData.phone) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Name and phone are required`);
          continue;
        }

        // Build query for checking duplicates
        let duplicateQuery: any = {};

        if (duplicateCheckField === "phone") {
          duplicateQuery = { phone: customerData.phone };
        } else if (duplicateCheckField === "email" && customerData.email) {
          duplicateQuery = { email: customerData.email };
        } else if (duplicateCheckField === "both") {
          duplicateQuery = {
            $or: [
              { phone: customerData.phone },
              ...(customerData.email ? [{ email: customerData.email }] : []),
            ],
          };
        } else {
          duplicateQuery = { phone: customerData.phone };
        }

        // Check if customer already exists
        const existingCustomer = await Customer.findOne(duplicateQuery);

        if (existingCustomer) {
          if (updateExisting) {
            // Update existing customer
            const updatedCustomer = await Customer.findByIdAndUpdate(
              existingCustomer._id,
              {
                name: customerData.name.trim(),
                phone: customerData.phone.trim(),
                email: customerData.email
                  ? customerData.email.trim().toLowerCase()
                  : existingCustomer.email,
                address: customerData.address
                  ? customerData.address.trim()
                  : existingCustomer.address,
                gstNumber: customerData.gstNumber
                  ? customerData.gstNumber.trim().toUpperCase()
                  : existingCustomer.gstNumber,
                panNumber: customerData.panNumber
                  ? customerData.panNumber.trim().toUpperCase()
                  : existingCustomer.panNumber,
                notes: customerData.notes
                  ? customerData.notes.trim()
                  : existingCustomer.notes,
              },
              { new: true, runValidators: true }
            );

            results.updated++;
            results.created.push(updatedCustomer);
          } else if (skipDuplicates) {
            // Skip duplicate
            results.skipped++;
            results.duplicates.push(
              `Row ${i + 1}: ${customerData.name} (${customerData.phone})`
            );
          } else {
            // Report as failed
            results.failed++;
            results.errors.push(
              `Row ${i + 1}: Customer with phone ${
                customerData.phone
              } already exists`
            );
          }
          continue;
        }

        // Create new customer
        const newCustomer = new Customer({
          name: customerData.name.trim(),
          phone: customerData.phone.trim(),
          email: customerData.email
            ? customerData.email.trim().toLowerCase()
            : undefined,
          address: customerData.address
            ? customerData.address.trim()
            : undefined,
          gstNumber: customerData.gstNumber
            ? customerData.gstNumber.trim().toUpperCase()
            : undefined,
          panNumber: customerData.panNumber
            ? customerData.panNumber.trim().toUpperCase()
            : undefined,
          notes: customerData.notes ? customerData.notes.trim() : undefined,
          totalPurchases: 0,
          isActive: true,
        });

        await newCustomer.save();
        results.successful++;
        results.created.push(newCustomer);
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    let message = `Import completed: ${results.successful} created`;
    if (results.updated > 0) message += `, ${results.updated} updated`;
    if (results.skipped > 0) message += `, ${results.skipped} skipped`;
    if (results.failed > 0) message += `, ${results.failed} failed`;

    return NextResponse.json({
      success: true,
      data: results,
      message,
    });
  } catch (error) {
    console.error("Failed to bulk import customers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to bulk import customers",
      },
      { status: 500 }
    );
  }
}
