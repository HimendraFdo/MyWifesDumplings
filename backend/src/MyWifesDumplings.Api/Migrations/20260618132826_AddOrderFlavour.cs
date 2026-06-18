using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyWifesDumplings.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderFlavour : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Flavour",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Flavour",
                table: "Orders");
        }
    }
}
