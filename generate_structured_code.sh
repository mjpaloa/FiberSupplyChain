#!/bin/bash

OUTPUT="SOURCE_CODE.md"

echo "# Capstone Project: Fiber Supply Chain Management System" > $OUTPUT
echo "## Chapter 5: Implementation and Source Code" >> $OUTPUT
echo "" >> $OUTPUT
echo "This section contains the consolidated and organized source code for the Fiber Supply Chain Management System. The code is structured by functional modules to facilitate review and documentation." >> $OUTPUT
echo "" >> $OUTPUT

add_section() {
    local title=$1
    local pattern=$2
    local files=$(find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" -o -name "*.html" -o -name "*.js" \) -path "$pattern" | sort)
    
    if [ ! -z "$files" ]; then
        echo "### $title" >> $OUTPUT
        echo "" >> $OUTPUT
        for file in $files; do
            # Skip node_modules and .git
            [[ "$file" == *"node_modules"* ]] && continue
            [[ "$file" == *".git"* ]] && continue
            
            # Clean path for cleaner display
            clean_path=${file#./}
            
            echo "#### File: $clean_path" >> $OUTPUT
            ext="${file##*.}"; lang="text"
            case "$ext" in
                tsx) lang="tsx" ;;
                ts) lang="typescript" ;;
                css) lang="css" ;;
                html) lang="html" ;;
                js) lang="javascript" ;;
            esac
            echo '```'"$lang" >> $OUTPUT
            cat "$file" >> $OUTPUT
            echo '```' >> $OUTPUT
            echo "" >> $OUTPUT
        done
    fi
}

echo "## 1. Frontend: Core & Context" >> $OUTPUT
add_section "Environment & Styles" "./frontend/src/*.css"
add_section "Core Entry Points" "./frontend/src/App.tsx"
add_section "Main Entry" "./frontend/src/main.tsx"

echo "## 2. Frontend: Authentication Module" >> $OUTPUT
add_section "Auth Logic" "./frontend/src/Auth/*"

echo "## 3. Frontend: Municipal Agricultural Office (MAO) Module" >> $OUTPUT
add_section "MAO Components" "./frontend/src/components/MAO/*"

echo "## 4. Frontend: Association (CUSAFA) Module" >> $OUTPUT
add_section "Association Components" "./frontend/src/components/Association/*"

echo "## 5. Frontend: Farmer Module" >> $OUTPUT
add_section "Farmer Components" "./frontend/src/components/Farmers/*"

echo "## 6. Frontend: Buyer Module" >> $OUTPUT
add_section "Buyer Components" "./frontend/src/components/Buyers/*"

echo "## 7. Frontend: Shared Components & Public Pages" >> $OUTPUT
add_section "Shared Components" "./frontend/src/components/Shared/*"
add_section "Public Components" "./frontend/src/components/Public/*"
add_section "Support Components" "./frontend/src/components/Support/*"

echo "## 8. Frontend: Pages & Routing" >> $OUTPUT
add_section "Primary Pages" "./frontend/src/pages/*"

echo "## 9. Frontend: Utilities & Data Types" >> $OUTPUT
add_section "Utilities" "./frontend/src/utils/*"
add_section "Types" "./frontend/src/types/*"

echo "## 10. Backend: Models & Business Logic" >> $OUTPUT
echo "Note: API routes and environment configurations are excluded for security." >> $OUTPUT
add_section "Data Models" "./backend/src/models/*"
add_section "Middlewares" "./backend/src/middleware/*"
add_section "Services" "./backend/src/services/*"
add_section "Controllers (Logic)" "./backend/src/controllers/*"

echo "## 11. Backend: Core Server" >> $OUTPUT
add_section "Server Entry" "./backend/src/server.ts"

echo "Successfully generated structured source code."
