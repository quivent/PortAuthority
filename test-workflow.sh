#!/bin/bash
# Comprehensive test workflow for Porter CLI

set -e  # Exit on error

echo "========================================="
echo "Porter CLI - Comprehensive Test Workflow"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}➜ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Test 1: Version check
print_step "Test 1: Checking version"
porter --version
print_success "Version check passed"
echo ""

# Test 2: Set base domain
print_step "Test 2: Setting base domain"
porter set base localhost
print_success "Base domain set"
echo ""

# Test 3: Create multiple mappings
print_step "Test 3: Creating multiple mappings"
porter map frontend 3000
porter map backend 8080
porter route database 5432  # Using route alias
porter map admin 4000
print_success "Mappings created"
echo ""

# Test 4: List all mappings
print_step "Test 4: Listing all mappings"
porter list
print_success "Mappings listed"
echo ""

# Test 5: View command tree
print_step "Test 5: Viewing command tree"
porter tree 1
print_success "Command tree displayed"
echo ""

# Test 6: Check configuration file
print_step "Test 6: Verifying configuration file"
echo "Configuration file contents:"
cat ~/.porter/config.toml
print_success "Configuration file verified"
echo ""

# Test 7: Remove a mapping
print_step "Test 7: Removing a mapping"
porter unmap database
porter list
print_success "Mapping removed"
echo ""

# Test 8: Test help command
print_step "Test 8: Testing help command"
porter --help > /dev/null 2>&1
print_success "Help command works"
echo ""

# Test 9: Test map subcommand help
print_step "Test 9: Testing map subcommand help"
porter map --help > /dev/null 2>&1
print_success "Map subcommand help works"
echo ""

# Final state
print_step "Final configuration state"
porter list
echo ""

# Summary
echo "========================================="
echo "All tests completed successfully!"
echo "========================================="
echo ""
echo "Cleanup: Run 'porter reset' to clear all test mappings"
echo ""
