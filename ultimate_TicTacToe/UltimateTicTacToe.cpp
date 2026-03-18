// HeslaNik_UltimateTicTacToe.cpp : Defines the entry point for the console application.
//

//#include "stdafx.h"
#include <iostream>
#include <string>
#include <time.h>

using namespace std;

/////////////////////////////////////////////////////////////////
//Enum
enum Mark
{
	X_mark,			//claimed by player_X							
	O_mark,			//	"	  "  player_O							
	Unwinnable,		//unwinnable for both players					
	Winnable,		//winnable for both players	in one move					
	X_fork,			//winnable two ways for player_X				
	O_fork,			//	"		"	"	 "  player_O	
	X_advantage,	//sets up to be a fork for player_X regardless of what opponent does	
	O_advantage,	//	"  "  "	 "	"	"	"  player_O		"		"	"	"		"
	X_blockable,	//fork or win for player_X in one move or bust			
	O_blockable,	// "	"  "	" player_O	"	"	"	"	"		
	open_space		//none of the above								
};
/////////////////////////////////////////////////////////////////
//Enum Output Stuff
std::ostream& operator<<(std::ostream& os, Mark m)
{//This switches the output of mark enum names to their mark characters
	switch (m)
	{
	case X_mark: os << "X"; break;
	case O_mark: os << "O"; break;
	case Winnable: os << "_"; break;
	case open_space: os << "_"; break;
	default: break; //os.setstate(std::ios_base::failbit);
	}
	return os;
}

/////////////////////////////////////////////////////////////////
//Classes
class Board //The board
{
	//Variables
	Mark Tile[3][3]; //3 by 3 board
	int X_turns[8], O_turns[8]; //number of turns till player x / o wins. 0 for won already or 4 for can't win.

					 //Friends
	friend class Player; //the parent player class can use Board's functions but the children can't
	friend class Board_9x9;

private:
	//Constructor
	Board() {}
			   //Set Functions
	void ClearBoard() //sets each tile to be an "open_space"
	{
		for (int i = 0; i < 3; i++) //I like using 'i' as index for these for loops
			for (int j = 0; j < 3; j++) //and 'j' for the next index
				Tile[i][j] = open_space;
		Check_Turns();
	}
	void MarkTile(int x, int y, bool m) //m being true is for player_x, m being false is for player_o
	{
		if (m) //marks the tile
			Tile[x][y] = X_mark;
		else
			Tile[x][y] = O_mark;
	}
	void MarkTile(int x, int y, Mark m) { Tile[x][y] = m; }
	void Check_Turns()
	{
		for (int index = 0; index < 8; index++)
		{
			X_turns[index] = CountTurns(true, index);
			O_turns[index] = CountTurns(false, index);
		}
	}

	//Get Functions
	Mark GetTile(int x, int y) { return Tile[x][y]; } //get the tile at specific x and y coordinate
	int Get_TurnsToWin(bool ecks, int index)
	{
		if (ecks)
			return X_turns[index];
		else
			return O_turns[index];
	}
	int CountTurns(bool ecks, int index)
	{
		Mark m;

		if (ecks)
			m = X_mark;
		else
			m = O_mark;
		
		switch (index)
		{
			case 0:
				if (GetTile(0, 0) == m && GetTile(0, 1) == m && GetTile(0, 2) == m)
					return 0;
				else if (GetTile(0, 0) == m && GetTile(0, 1) == m && Check_EmptyTile(0, 2) ||
					GetTile(0, 0) == m && Check_EmptyTile(0, 1) && GetTile(0, 2) == m ||
					Check_EmptyTile(0, 0) && GetTile(0, 1) == m && GetTile(0, 2) == m)
					return 1;
				else if (GetTile(0, 0) == m && Check_EmptyTile(0, 1) && Check_EmptyTile(0, 2) ||
					Check_EmptyTile(0, 0) && Check_EmptyTile(0, 1) && GetTile(0, 2) == m ||
					Check_EmptyTile(0, 0) && GetTile(0, 1) == m && Check_EmptyTile(0, 2))
					return 2;
				else if (Check_EmptyTile(0, 0) && Check_EmptyTile(0, 1) && Check_EmptyTile(0, 2))
					return 3;
				else
					return 4;
				break;
			case 1:
				if (GetTile(1, 0) == m && GetTile(1, 1) == m && GetTile(1, 2) == m)
					return 0;
				else if (GetTile(1, 0) == m && GetTile(1, 1) == m && Check_EmptyTile(1, 2) ||
					GetTile(1, 0) == m && Check_EmptyTile(1, 1) && GetTile(1, 2) == m ||
					Check_EmptyTile(1, 0) && GetTile(1, 1) == m && GetTile(1, 2) == m)
					return 1;
				else if (GetTile(1, 0) == m && Check_EmptyTile(1, 1) && Check_EmptyTile(1, 2) ||
					Check_EmptyTile(1, 0) && Check_EmptyTile(1, 1) && GetTile(1, 2) == m ||
					Check_EmptyTile(1, 0) && GetTile(1, 1) == m && Check_EmptyTile(1, 2))
					return 2;
				else if (Check_EmptyTile(1, 0) && Check_EmptyTile(1, 1) && Check_EmptyTile(1, 2))
					return 3;
				else
					return 4;
				break;
			case 2:
				if (GetTile(2, 0) == m && GetTile(2, 1) == m && GetTile(2, 2) == m)
					return 0;
				else if (GetTile(2, 0) == m && GetTile(2, 1) == m && Check_EmptyTile(2, 2) ||
					GetTile(2, 0) == m && Check_EmptyTile(2, 1) && GetTile(2, 2) == m ||
					Check_EmptyTile(2, 0) && GetTile(2, 1) == m && GetTile(2, 2) == m)
					return 1;
				else if (GetTile(2, 0) == m && Check_EmptyTile(2, 1) && Check_EmptyTile(2, 2) ||
					Check_EmptyTile(2, 0) && Check_EmptyTile(2, 1) && GetTile(2, 2) == m ||
					Check_EmptyTile(2, 0) && GetTile(2, 1) == m && Check_EmptyTile(2, 2))
					return 2;
				else if (Check_EmptyTile(2, 0) && Check_EmptyTile(2, 1) && Check_EmptyTile(2, 2))
					return 3;
				else
					return 4;
				break;
			case 3:
				if (GetTile(0, 0) == m && GetTile(1, 0) == m && GetTile(2, 0) == m)
					return 0;
				else if (GetTile(0, 0) == m && GetTile(1, 0) == m && Check_EmptyTile(2, 0) ||
					GetTile(0, 0) == m && Check_EmptyTile(1, 0) && GetTile(2, 0) == m ||
					Check_EmptyTile(0, 0) && GetTile(1, 0) == m && GetTile(2, 0) == m)
					return 1;
				else if (GetTile(0, 0) == m && Check_EmptyTile(1, 0) && Check_EmptyTile(2, 0) ||
					Check_EmptyTile(0, 0) && Check_EmptyTile(1, 0) && GetTile(2, 0) == m ||
					Check_EmptyTile(0, 0) && GetTile(1, 0) == m && Check_EmptyTile(2, 0))
					return 2;
				else if (Check_EmptyTile(0, 0) && Check_EmptyTile(1, 0) && Check_EmptyTile(2, 0))
					return 3;
				else
					return 4;
				break;
			case 4:
				if (GetTile(0, 1) == m && GetTile(1, 1) == m && GetTile(2, 1) == m)
					return 0;
				else if (GetTile(0, 1) == m && GetTile(1, 1) == m && Check_EmptyTile(2, 1) ||
					GetTile(0, 1) == m && Check_EmptyTile(1, 1) && GetTile(2, 1) == m ||
					Check_EmptyTile(0, 1) && GetTile(1, 1) == m && GetTile(2, 1) == m)
					return 1;
				else if (GetTile(0, 1) == m && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 1) ||
					Check_EmptyTile(0, 1) && Check_EmptyTile(1, 1) && GetTile(2, 1) == m ||
					Check_EmptyTile(0, 1) && GetTile(1, 1) == m && Check_EmptyTile(2, 1))
					return 2;
				else if (Check_EmptyTile(0, 1) && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 1))
					return 3;
				else
					return 4;
				break;
			case 5:
				if (GetTile(0, 2) == m && GetTile(1, 2) == m && GetTile(2, 2) == m)
					return 0;
				else if (GetTile(0, 2) == m && GetTile(1, 2) == m && Check_EmptyTile(2, 2) ||
					GetTile(0, 2) == m && Check_EmptyTile(1, 2) && GetTile(2, 2) == m ||
					Check_EmptyTile(0, 2) && GetTile(1, 2) == m && GetTile(2, 2) == m)
					return 1;
				else if (GetTile(0, 2) == m && Check_EmptyTile(1, 2) && Check_EmptyTile(2, 2) ||
					Check_EmptyTile(0, 2) && Check_EmptyTile(1, 2) && GetTile(2, 2) == m ||
					Check_EmptyTile(0, 2) && GetTile(1, 2) == m && Check_EmptyTile(2, 2))
					return 2;
				else if (Check_EmptyTile(0, 2) && Check_EmptyTile(1, 2) && Check_EmptyTile(2, 2))
					return 3;
				else
					return 4;
				break;
			case 6:
				if (GetTile(0, 0) == m && GetTile(1, 1) == m && GetTile(2, 2) == m)
					return 0;
				else if (GetTile(0, 0) == m && GetTile(1, 1) == m && Check_EmptyTile(2, 2) ||
					GetTile(0, 0) == m && Check_EmptyTile(1, 1) && GetTile(2, 2) == m ||
					Check_EmptyTile(0, 0) && GetTile(1, 1) == m && GetTile(2, 2) == m)
					return 1;
				else if (GetTile(0, 0) == m && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 2) ||
					Check_EmptyTile(0, 0) && Check_EmptyTile(1, 1) && GetTile(2, 2) == m ||
					Check_EmptyTile(0, 0) && GetTile(1, 1) == m && Check_EmptyTile(2, 2))
					return 2;
				else if (Check_EmptyTile(0, 0) && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 2))
					return 3;
				else
					return 4;
				break;
			case 7:
				if (GetTile(0, 2) == m && GetTile(1, 1) == m && GetTile(2, 0) == m)
					return 0;
				else if (GetTile(0, 2) == m && GetTile(1, 1) == m && Check_EmptyTile(2, 0) ||
					GetTile(0, 2) == m && Check_EmptyTile(1, 1) && GetTile(2, 0) == m ||
					Check_EmptyTile(0, 2) && GetTile(1, 1) == m && GetTile(2, 0) == m)
					return 1;
				else if (GetTile(0, 2) == m && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 0) ||
					Check_EmptyTile(0, 2) && Check_EmptyTile(1, 1) && GetTile(2, 0) == m ||
					Check_EmptyTile(0, 2) && GetTile(1, 1) == m && Check_EmptyTile(2, 0))
					return 2;
				else if (Check_EmptyTile(0, 2) && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 0))
					return 3;
				else
					return 4;
				break;
			default:
				return 5;
				break;
		}
	}
	bool Check_EmptyTile(int x, int y)
	{
		if (GetTile(x, y) == open_space || (GetTile(x, y) != X_mark && GetTile(x, y) != O_mark && GetTile(x, y) != Unwinnable))
			return true;
		else
			return false;
	}

};
class Board_Scalable //The board
{
	//Variables
	Mark Tile[3][3]; //3 by 3 board
	int X_turns[8], O_turns[8]; //number of turns till player x / o wins. 0 for won already or 4 for can't win.

								//Friends
	friend class Player; //the parent player class can use Board's functions but the children can't
	friend class Board_9x9;

private:
	//Constructor
	Board_Scalable() {}
	//Set Functions
	void ClearBoard() //sets each tile to be an "open_space"
	{
		for (int i = 0; i < 3; i++) //I like using 'i' as index for these for loops
			for (int j = 0; j < 3; j++) //and 'j' for the next index
				Tile[i][j] = open_space;
		Check_Turns();
	}
	void MarkTile(int x, int y, bool m) //m being true is for player_x, m being false is for player_o
	{
		if (m) //marks the tile
			Tile[x][y] = X_mark;
		else
			Tile[x][y] = O_mark;
	}
	void MarkTile(int x, int y, Mark m) { Tile[x][y] = m; }
	void Check_Turns()
	{
		for (int index = 0; index < 8; index++)
		{
			X_turns[index] = CountTurns(true, index);
			O_turns[index] = CountTurns(false, index);
		}
	}

	//Get Functions
	Mark GetTile(int x, int y) { return Tile[x][y]; } //get the tile at specific x and y coordinate
	int Get_TurnsToWin(bool ecks, int index)
	{
		if (ecks)
			return X_turns[index];
		else
			return O_turns[index];
	}
	int CountTurns(bool ecks, int index)
	{
		Mark m;

		if (ecks)
			m = X_mark;
		else
			m = O_mark;

		switch (index)
		{
		case 0:
			if (GetTile(0, 0) == m && GetTile(0, 1) == m && GetTile(0, 2) == m)
				return 0;
			else if (GetTile(0, 0) == m && GetTile(0, 1) == m && Check_EmptyTile(0, 2) ||
				GetTile(0, 0) == m && Check_EmptyTile(0, 1) && GetTile(0, 2) == m ||
				Check_EmptyTile(0, 0) && GetTile(0, 1) == m && GetTile(0, 2) == m)
				return 1;
			else if (GetTile(0, 0) == m && Check_EmptyTile(0, 1) && Check_EmptyTile(0, 2) ||
				Check_EmptyTile(0, 0) && Check_EmptyTile(0, 1) && GetTile(0, 2) == m ||
				Check_EmptyTile(0, 0) && GetTile(0, 1) == m && Check_EmptyTile(0, 2))
				return 2;
			else if (Check_EmptyTile(0, 0) && Check_EmptyTile(0, 1) && Check_EmptyTile(0, 2))
				return 3;
			else
				return 4;
			break;
		case 1:
			if (GetTile(1, 0) == m && GetTile(1, 1) == m && GetTile(1, 2) == m)
				return 0;
			else if (GetTile(1, 0) == m && GetTile(1, 1) == m && Check_EmptyTile(1, 2) ||
				GetTile(1, 0) == m && Check_EmptyTile(1, 1) && GetTile(1, 2) == m ||
				Check_EmptyTile(1, 0) && GetTile(1, 1) == m && GetTile(1, 2) == m)
				return 1;
			else if (GetTile(1, 0) == m && Check_EmptyTile(1, 1) && Check_EmptyTile(1, 2) ||
				Check_EmptyTile(1, 0) && Check_EmptyTile(1, 1) && GetTile(1, 2) == m ||
				Check_EmptyTile(1, 0) && GetTile(1, 1) == m && Check_EmptyTile(1, 2))
				return 2;
			else if (Check_EmptyTile(1, 0) && Check_EmptyTile(1, 1) && Check_EmptyTile(1, 2))
				return 3;
			else
				return 4;
			break;
		case 2:
			if (GetTile(2, 0) == m && GetTile(2, 1) == m && GetTile(2, 2) == m)
				return 0;
			else if (GetTile(2, 0) == m && GetTile(2, 1) == m && Check_EmptyTile(2, 2) ||
				GetTile(2, 0) == m && Check_EmptyTile(2, 1) && GetTile(2, 2) == m ||
				Check_EmptyTile(2, 0) && GetTile(2, 1) == m && GetTile(2, 2) == m)
				return 1;
			else if (GetTile(2, 0) == m && Check_EmptyTile(2, 1) && Check_EmptyTile(2, 2) ||
				Check_EmptyTile(2, 0) && Check_EmptyTile(2, 1) && GetTile(2, 2) == m ||
				Check_EmptyTile(2, 0) && GetTile(2, 1) == m && Check_EmptyTile(2, 2))
				return 2;
			else if (Check_EmptyTile(2, 0) && Check_EmptyTile(2, 1) && Check_EmptyTile(2, 2))
				return 3;
			else
				return 4;
			break;
		case 3:
			if (GetTile(0, 0) == m && GetTile(1, 0) == m && GetTile(2, 0) == m)
				return 0;
			else if (GetTile(0, 0) == m && GetTile(1, 0) == m && Check_EmptyTile(2, 0) ||
				GetTile(0, 0) == m && Check_EmptyTile(1, 0) && GetTile(2, 0) == m ||
				Check_EmptyTile(0, 0) && GetTile(1, 0) == m && GetTile(2, 0) == m)
				return 1;
			else if (GetTile(0, 0) == m && Check_EmptyTile(1, 0) && Check_EmptyTile(2, 0) ||
				Check_EmptyTile(0, 0) && Check_EmptyTile(1, 0) && GetTile(2, 0) == m ||
				Check_EmptyTile(0, 0) && GetTile(1, 0) == m && Check_EmptyTile(2, 0))
				return 2;
			else if (Check_EmptyTile(0, 0) && Check_EmptyTile(1, 0) && Check_EmptyTile(2, 0))
				return 3;
			else
				return 4;
			break;
		case 4:
			if (GetTile(0, 1) == m && GetTile(1, 1) == m && GetTile(2, 1) == m)
				return 0;
			else if (GetTile(0, 1) == m && GetTile(1, 1) == m && Check_EmptyTile(2, 1) ||
				GetTile(0, 1) == m && Check_EmptyTile(1, 1) && GetTile(2, 1) == m ||
				Check_EmptyTile(0, 1) && GetTile(1, 1) == m && GetTile(2, 1) == m)
				return 1;
			else if (GetTile(0, 1) == m && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 1) ||
				Check_EmptyTile(0, 1) && Check_EmptyTile(1, 1) && GetTile(2, 1) == m ||
				Check_EmptyTile(0, 1) && GetTile(1, 1) == m && Check_EmptyTile(2, 1))
				return 2;
			else if (Check_EmptyTile(0, 1) && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 1))
				return 3;
			else
				return 4;
			break;
		case 5:
			if (GetTile(0, 2) == m && GetTile(1, 2) == m && GetTile(2, 2) == m)
				return 0;
			else if (GetTile(0, 2) == m && GetTile(1, 2) == m && Check_EmptyTile(2, 2) ||
				GetTile(0, 2) == m && Check_EmptyTile(1, 2) && GetTile(2, 2) == m ||
				Check_EmptyTile(0, 2) && GetTile(1, 2) == m && GetTile(2, 2) == m)
				return 1;
			else if (GetTile(0, 2) == m && Check_EmptyTile(1, 2) && Check_EmptyTile(2, 2) ||
				Check_EmptyTile(0, 2) && Check_EmptyTile(1, 2) && GetTile(2, 2) == m ||
				Check_EmptyTile(0, 2) && GetTile(1, 2) == m && Check_EmptyTile(2, 2))
				return 2;
			else if (Check_EmptyTile(0, 2) && Check_EmptyTile(1, 2) && Check_EmptyTile(2, 2))
				return 3;
			else
				return 4;
			break;
		case 6:
			if (GetTile(0, 0) == m && GetTile(1, 1) == m && GetTile(2, 2) == m)
				return 0;
			else if (GetTile(0, 0) == m && GetTile(1, 1) == m && Check_EmptyTile(2, 2) ||
				GetTile(0, 0) == m && Check_EmptyTile(1, 1) && GetTile(2, 2) == m ||
				Check_EmptyTile(0, 0) && GetTile(1, 1) == m && GetTile(2, 2) == m)
				return 1;
			else if (GetTile(0, 0) == m && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 2) ||
				Check_EmptyTile(0, 0) && Check_EmptyTile(1, 1) && GetTile(2, 2) == m ||
				Check_EmptyTile(0, 0) && GetTile(1, 1) == m && Check_EmptyTile(2, 2))
				return 2;
			else if (Check_EmptyTile(0, 0) && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 2))
				return 3;
			else
				return 4;
			break;
		case 7:
			if (GetTile(0, 2) == m && GetTile(1, 1) == m && GetTile(2, 0) == m)
				return 0;
			else if (GetTile(0, 2) == m && GetTile(1, 1) == m && Check_EmptyTile(2, 0) ||
				GetTile(0, 2) == m && Check_EmptyTile(1, 1) && GetTile(2, 0) == m ||
				Check_EmptyTile(0, 2) && GetTile(1, 1) == m && GetTile(2, 0) == m)
				return 1;
			else if (GetTile(0, 2) == m && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 0) ||
				Check_EmptyTile(0, 2) && Check_EmptyTile(1, 1) && GetTile(2, 0) == m ||
				Check_EmptyTile(0, 2) && GetTile(1, 1) == m && Check_EmptyTile(2, 0))
				return 2;
			else if (Check_EmptyTile(0, 2) && Check_EmptyTile(1, 1) && Check_EmptyTile(2, 0))
				return 3;
			else
				return 4;
			break;
		default:
			return 5;
			break;
		}
	}
	bool Check_EmptyTile(int x, int y)
	{
		if (GetTile(x, y) == open_space || (GetTile(x, y) != X_mark && GetTile(x, y) != O_mark && GetTile(x, y) != Unwinnable))
			return true;
		else
			return false;
	}

};
class Board_9x9 : public Board
{
	//Variables
	Board small_board[3][3]; //each individual board in the 9 by 9
	Board large_board; //treating each 3 by 3 board as a single space


					   //friends
	friend class TicTacToe; //so the controlling TicTacToe class can access it's private functions
	friend class Player_AI; //the children of player class can use Board's functions but the parent Player class can't
	friend class Player_User;

private:
	//Constructor
	Board_9x9() {}

	//Set Functions
	void ClearBoard()
	{
		for (int i = 0; i < 3; i++) //I like using 'i' as index for these for loops
			for (int j = 0; j < 3; j++) //and 'j' for the next index
				small_board[i][j].ClearBoard();
		large_board.ClearBoard();
	}
	void MarkTile(int zx, int zy, int x, int y, bool m) { small_board[zx][zy].MarkTile(x, y, m); }
	void MarkTile(int x, int y, Mark m) { large_board.MarkTile(x, y, m); }

	//Get Functions
	Mark GetTile(int zx, int zy, int x, int y) { return small_board[zx][zy].GetTile(x, y); }
	Mark GetTile(int x, int y) { return large_board.GetTile(x, y); }
	//Board GetBoard(int x, int y) { return small_board[x][y]; }
	//Board GetBoard() { return large_board; }
	Board& GetBoard(int x, int y) { return small_board[x][y]; }
	Board& GetBoard() { return large_board; }
	int GetTurns(int x, int y, bool ecks, int index) { return small_board[x][y].Get_TurnsToWin(ecks, index); }
	int GetTurns(bool ecks, int index) { return large_board.Get_TurnsToWin(ecks, index); }

	bool Check_Marked(int i, int j, Mark m)
	{
		if (GetTile(i, j, 0, 0) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 0, 2) == m ||
			GetTile(i, j, 1, 0) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 1, 2) == m ||
			GetTile(i, j, 2, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 0) == m ||
			GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 1) == m ||
			GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 2) == m && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 0) == m)
			return true;
		return false;
	}
	bool Check_Unwinnable(int i, int j, Mark m)
	{
		if (!(
			((GetTile(i, j, 0, 0) == m || GetTile(i, j, 0, 0) == open_space) &&
			(GetTile(i, j, 0, 1) == m || GetTile(i, j, 0, 1) == open_space) &&
			(GetTile(i, j, 0, 2) == m || GetTile(i, j, 0, 2) == open_space)) ||
			((GetTile(i, j, 1, 0) == m || GetTile(i, j, 1, 0) == open_space) &&
			(GetTile(i, j, 1, 1) == m || GetTile(i, j, 1, 1) == open_space) &&
			(GetTile(i, j, 1, 2) == m || GetTile(i, j, 1, 2) == open_space)) ||
			((GetTile(i, j, 2, 0) == m || GetTile(i, j, 2, 0) == open_space) &&
			(GetTile(i, j, 2, 1) == m || GetTile(i, j, 2, 1) == open_space) &&
			(GetTile(i, j, 2, 2) == m || GetTile(i, j, 2, 2) == open_space)) ||
			((GetTile(i, j, 0, 0) == m || GetTile(i, j, 0, 0) == open_space) &&
			(GetTile(i, j, 1, 0) == m || GetTile(i, j, 1, 0) == open_space) &&
			(GetTile(i, j, 2, 0) == m || GetTile(i, j, 2, 0) == open_space)) ||
			((GetTile(i, j, 0, 1) == m || GetTile(i, j, 0, 1) == open_space) &&
			(GetTile(i, j, 1, 1) == m || GetTile(i, j, 1, 1) == open_space) &&
			(GetTile(i, j, 2, 1) == m || GetTile(i, j, 2, 1) == open_space)) ||
			((GetTile(i, j, 0, 2) == m || GetTile(i, j, 0, 2) == open_space) &&
			(GetTile(i, j, 1, 2) == m || GetTile(i, j, 1, 2) == open_space) &&
			(GetTile(i, j, 2, 2) == m || GetTile(i, j, 2, 2) == open_space)) ||
			((GetTile(i, j, 0, 0) == m || GetTile(i, j, 0, 0) == open_space) &&
			(GetTile(i, j, 1, 1) == m || GetTile(i, j, 1, 1) == open_space) &&
			(GetTile(i, j, 2, 2) == m || GetTile(i, j, 2, 2) == open_space)) ||
			((GetTile(i, j, 0, 2) == m || GetTile(i, j, 0, 2) == open_space) &&
			(GetTile(i, j, 1, 1) == m || GetTile(i, j, 1, 1) == open_space) &&
			(GetTile(i, j, 2, 0) == m || GetTile(i, j, 2, 0) == open_space))
			))
			return true;
		return false;
	}
	bool Check_Winnable(int i, int j, Mark m)
	{
		if (GetTile(i, j, 0, 0) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 0, 2) == open_space ||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 0, 1) == open_space && GetTile(i, j, 0, 2) == m ||
			GetTile(i, j, 0, 0) == open_space && GetTile(i, j, 0, 1) == m && GetTile(i, j, 0, 2) == m
			||
			GetTile(i, j, 1, 0) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 1, 2) == open_space ||
			GetTile(i, j, 1, 0) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 1, 2) == m ||
			GetTile(i, j, 1, 0) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 1, 2) == m
			||
			GetTile(i, j, 2, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 2, 2) == open_space ||
			GetTile(i, j, 2, 0) == m && GetTile(i, j, 2, 1) == open_space && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 2, 0) == open_space && GetTile(i, j, 2, 1) == m && GetTile(i, j, 2, 2) == m
			||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 0) == open_space ||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 0) == open_space && GetTile(i, j, 2, 0) == m ||
			GetTile(i, j, 0, 0) == open_space && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 0) == m
			||
			GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 1) == open_space ||
			GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 2, 1) == m ||
			GetTile(i, j, 0, 1) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 1) == m
			||
			GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 2) == m && GetTile(i, j, 2, 2) == open_space ||
			GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 2) == open_space && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 0, 2) == open_space && GetTile(i, j, 1, 2) == m && GetTile(i, j, 2, 2) == m
			||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 2) == open_space ||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 0, 0) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 2) == m
			||
			GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 0) == open_space ||
			GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 2, 0) == m ||
			GetTile(i, j, 0, 2) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 0) == m)
			return true;
		return false;
	}
	bool Check_Forked(int i, int j, Mark m)
	{
		int count = 0;

		if (GetTile(i, j, 0, 0) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 0, 2) == open_space ||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 0, 1) == open_space && GetTile(i, j, 0, 2) == m ||
			GetTile(i, j, 0, 0) == open_space && GetTile(i, j, 0, 1) == m && GetTile(i, j, 0, 2) == m)
			count++;

		if (GetTile(i, j, 1, 0) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 1, 2) == open_space ||
			GetTile(i, j, 1, 0) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 1, 2) == m ||
			GetTile(i, j, 1, 0) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 1, 2) == m)
			count++;

		if (GetTile(i, j, 2, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 2, 2) == open_space ||
			GetTile(i, j, 2, 0) == m && GetTile(i, j, 2, 1) == open_space && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 2, 0) == open_space && GetTile(i, j, 2, 1) == m && GetTile(i, j, 2, 2) == m)
			count++;

		if (GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 0) == open_space ||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 0) == open_space && GetTile(i, j, 2, 0) == m ||
			GetTile(i, j, 0, 0) == open_space && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 0) == m)
			count++;

		if (GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 1) == open_space ||
			GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 2, 1) == m ||
			GetTile(i, j, 0, 1) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 1) == m)
			count++;

		if (GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 2) == m && GetTile(i, j, 2, 2) == open_space ||
			GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 2) == open_space && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 0, 2) == open_space && GetTile(i, j, 1, 2) == m && GetTile(i, j, 2, 2) == m)
			count++;
	
		if (GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 2) == open_space ||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 0, 0) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 2) == m)
			count++;

		if (GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 0) == open_space ||
			GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 2, 0) == m ||
			GetTile(i, j, 0, 2) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 0) == m)
			count++;

		if (count > 1)
			return true;
		return false;
	}
	bool Check_Advantage(int i, int j, Mark m)
	{
		int num_x = 0, num_o = 0;

		for (int index1 = 0; index1 < 3; index1++)
			for (int index2 = 0; index2 < 3; index2++)
				if (GetTile(i, j, index1, index2) == X_mark)
					num_x++;
				else if (GetTile(i, j, index1, index2) == O_mark)
					num_o++;

		if (m == X_mark)
		{
			if (!(num_x == 3 && num_o == 1 && ((
				(GetTile(i, j, 0, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 0) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 2) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 0, 1) == m) ||
				(GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m)
				) || (
				(GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m && GetTile(i, j, 0, 1) == m) ||
				(GetTile(i, j, 1, 2) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 0) == m) ||
				(GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m)
				))))
				if ((num_x >= 2 && num_o == 0) || (num_x >= 3 && num_o <= 1))
					return true;
		}
		else if (m == O_mark)
		{
			if (!(num_o == 3 && num_x == 1 && ((
				(GetTile(i, j, 0, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 0) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 2) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 0, 1) == m) ||
				(GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m)
				) || (
				(GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m && GetTile(i, j, 0, 1) == m) ||
				(GetTile(i, j, 1, 2) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 0) == m) ||
				(GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m)
				))))
				if ((num_x == 0 && num_o >= 2) || (num_x <= 1 && num_o >= 3))
					return true;
		}

		return false;
	}
	bool Check_Blockable(int i, int j, Mark m)
	{
		int num_x = 0, num_o = 0;

		for (int index1 = 0; index1 < 3; index1++)
			for (int index2 = 0; index2 < 3; index2++)
				if (GetTile(i, j, index1, index2) == X_mark)
					num_x++;
				else if (GetTile(i, j, index1, index2) == O_mark)
					num_o++;

		if (m == X_mark)
		{
			if ((((GetTile(i, j, 0, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 0) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 2) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 0, 1) == m) ||
				(GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m)
				) || (
				(GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m && GetTile(i, j, 0, 1) == m) ||
				(GetTile(i, j, 1, 2) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 0) == m) ||
				(GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m)
				)) && num_o == 1 && num_x == 3)
				return true;
			else if ((num_x == 2 && num_o == 1) || (num_x >= 3 && num_o == 2))
				return true;
			if (num_x >= num_o + 1)
				return true;
		}		
		else if (m == O_mark)
		{
			if ((((GetTile(i, j, 0, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 0) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 2) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 0, 1) == m) ||
				(GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m)
				) || (
				(GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m) ||
				(GetTile(i, j, 2, 1) == m && GetTile(i, j, 1, 2) == m && GetTile(i, j, 0, 1) == m) ||
				(GetTile(i, j, 1, 2) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 0) == m) ||
				(GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 1) == m)
				)) && num_x == 1 && num_o == 3)
				return true;
			else if ((num_x == 1 && num_o == 2) || (num_x == 2 && num_o >= 3))
				return true;
			if (num_o >= num_x + 1)
				return true;
		}

		int count = 0;
		if (GetTile(i, j, 0, 0) == m && GetTile(i, j, 0, 1) == m && GetTile(i, j, 0, 2) == open_space ||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 0, 1) == open_space && GetTile(i, j, 0, 2) == m ||
			GetTile(i, j, 0, 0) == open_space && GetTile(i, j, 0, 1) == m && GetTile(i, j, 0, 2) == m)
			count++;
		if (GetTile(i, j, 1, 0) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 1, 2) == open_space ||
			GetTile(i, j, 1, 0) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 1, 2) == m ||
			GetTile(i, j, 1, 0) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 1, 2) == m)
			count++;
		if (GetTile(i, j, 2, 0) == m && GetTile(i, j, 2, 1) == m && GetTile(i, j, 2, 2) == open_space ||
			GetTile(i, j, 2, 0) == m && GetTile(i, j, 2, 1) == open_space && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 2, 0) == open_space && GetTile(i, j, 2, 1) == m && GetTile(i, j, 2, 2) == m)
			count++;
		if (GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 0) == open_space ||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 0) == open_space && GetTile(i, j, 2, 0) == m ||
			GetTile(i, j, 0, 0) == open_space && GetTile(i, j, 1, 0) == m && GetTile(i, j, 2, 0) == m)
			count++;
		if (GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 1) == open_space ||
			GetTile(i, j, 0, 1) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 2, 1) == m ||
			GetTile(i, j, 0, 1) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 1) == m)
			count++;
		if (GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 2) == m && GetTile(i, j, 2, 2) == open_space ||
			GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 2) == open_space && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 0, 2) == open_space && GetTile(i, j, 1, 2) == m && GetTile(i, j, 2, 2) == m)
			count++;
		if (GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 2) == open_space ||
			GetTile(i, j, 0, 0) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 2, 2) == m ||
			GetTile(i, j, 0, 0) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 2) == m)
			count++;
		if (GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 0) == open_space ||
			GetTile(i, j, 0, 2) == m && GetTile(i, j, 1, 1) == open_space && GetTile(i, j, 2, 0) == m ||
			GetTile(i, j, 0, 2) == open_space && GetTile(i, j, 1, 1) == m && GetTile(i, j, 2, 0) == m)
			count++;
		if (count == 1)
			return true;

		return false;
	}
	void CheckBoard()
	{
		for (int i = 0; i < 3; i++)
			for (int j = 0; j < 3; j++)
			{
				if (Check_Marked(i, j, X_mark))
					MarkTile(i, j, X_mark);
				else if (Check_Marked(i, j, O_mark))
					MarkTile(i, j, O_mark);
				else if (Check_Unwinnable(i, j, X_mark) && Check_Unwinnable(i, j, O_mark))
					MarkTile(i, j, Unwinnable);
				else if (Check_Winnable(i, j, X_mark) && Check_Winnable(i, j, O_mark))
					MarkTile(i, j, Winnable);
				else if (Check_Forked(i, j, X_mark))
					MarkTile(i, j, X_fork);
				else if (Check_Forked(i, j, O_mark))
					MarkTile(i, j, O_fork);
				else if (Check_Advantage(i, j, X_mark))
					MarkTile(i, j, X_advantage);
				else if (Check_Advantage(i, j, O_mark))
					MarkTile(i, j, O_advantage);
				else if (Check_Blockable(i, j, X_mark))
					MarkTile(i, j, X_blockable);
				else if (Check_Blockable(i, j, O_mark))
					MarkTile(i, j, O_blockable);
				else
					MarkTile(i, j, open_space);

				small_board[i][j].Check_Turns();
			}
		large_board.Check_Turns();
	}

	//Output
	void OutputBoardState()
	{
		cout << "	|	X=0		|	X=1		|	X=2		\n";
		cout << "--------+-----------------------+-----------------------+----------------------\n";
		cout << "	|    " << GetTile(0, 0, 0, 0) << "	    " << GetTile(0, 0, 1, 0) << "	   " << GetTile(0, 0, 2, 0) << "	|";
		cout << "    " << GetTile(1, 0, 0, 0) << "	    " << GetTile(1, 0, 1, 0) << "	   " << GetTile(1, 0, 2, 0) << "	|";
		cout << "    " << GetTile(2, 0, 0, 0) << "	    " << GetTile(2, 0, 1, 0) << "	   " << GetTile(2, 0, 2, 0) << "	\n";
		cout << "Y=0	|    " << GetTile(0, 0, 0, 1) << "	    " << GetTile(0, 0, 1, 1) << "	   " << GetTile(0, 0, 2, 1) << "	|";
		cout << "    " << GetTile(1, 0, 0, 1) << "	    " << GetTile(1, 0, 1, 1) << "	   " << GetTile(1, 0, 2, 1) << "	|";
		cout << "    " << GetTile(2, 0, 0, 1) << "	    " << GetTile(2, 0, 1, 1) << "	   " << GetTile(2, 0, 2, 1) << "	\n";
		cout << "	|    " << GetTile(0, 0, 0, 2) << "	    " << GetTile(0, 0, 1, 2) << "	   " << GetTile(0, 0, 2, 2) << "	|";
		cout << "    " << GetTile(1, 0, 0, 2) << "	    " << GetTile(1, 0, 1, 2) << "	   " << GetTile(1, 0, 2, 2) << "	|";
		cout << "    " << GetTile(2, 0, 0, 2) << "	    " << GetTile(2, 0, 1, 2) << "	   " << GetTile(2, 0, 2, 2) << "	\n";
		cout << "--------+-----------------------+-----------------------+----------------------\n";
		cout << "	|    " << GetTile(0, 1, 0, 0) << "	    " << GetTile(0, 1, 1, 0) << "	   " << GetTile(0, 1, 2, 0) << "	|";
		cout << "    " << GetTile(1, 1, 0, 0) << "	    " << GetTile(1, 1, 1, 0) << "	   " << GetTile(1, 1, 2, 0) << "	|";
		cout << "    " << GetTile(2, 1, 0, 0) << "	    " << GetTile(2, 1, 1, 0) << "	   " << GetTile(2, 1, 2, 0) << "	\n";
		cout << "Y=1	|    " << GetTile(0, 1, 0, 1) << "	    " << GetTile(0, 1, 1, 1) << "	   " << GetTile(0, 1, 2, 1) << "	|";
		cout << "    " << GetTile(1, 1, 0, 1) << "	    " << GetTile(1, 1, 1, 1) << "	   " << GetTile(1, 1, 2, 1) << "	|";
		cout << "    " << GetTile(2, 1, 0, 1) << "	    " << GetTile(2, 1, 1, 1) << "	   " << GetTile(2, 1, 2, 1) << "	\n";
		cout << "	|    " << GetTile(0, 1, 0, 2) << "	    " << GetTile(0, 1, 1, 2) << "	   " << GetTile(0, 1, 2, 2) << "	|";
		cout << "    " << GetTile(1, 1, 0, 2) << "	    " << GetTile(1, 1, 1, 2) << "	   " << GetTile(1, 1, 2, 2) << "	|";
		cout << "    " << GetTile(2, 1, 0, 2) << "	    " << GetTile(2, 1, 1, 2) << "	   " << GetTile(2, 1, 2, 2) << "	\n";
		cout << "--------+-----------------------+-----------------------+----------------------\n";
		cout << "	|    " << GetTile(0, 2, 0, 0) << "	    " << GetTile(0, 2, 1, 0) << "	   " << GetTile(0, 2, 2, 0) << "	|";
		cout << "    " << GetTile(1, 2, 0, 0) << "	    " << GetTile(1, 2, 1, 0) << "	   " << GetTile(1, 2, 2, 0) << "	|";
		cout << "    " << GetTile(2, 2, 0, 0) << "	    " << GetTile(2, 2, 1, 0) << "	   " << GetTile(2, 2, 2, 0) << "	\n";
		cout << "Y=2	|    " << GetTile(0, 2, 0, 1) << "	    " << GetTile(0, 2, 1, 1) << "	   " << GetTile(0, 2, 2, 1) << "	|";
		cout << "    " << GetTile(1, 2, 0, 1) << "	    " << GetTile(1, 2, 1, 1) << "	   " << GetTile(1, 2, 2, 1) << "	|";
		cout << "    " << GetTile(2, 2, 0, 1) << "	    " << GetTile(2, 2, 1, 1) << "	   " << GetTile(2, 2, 2, 1) << "	\n";
		cout << "	|    " << GetTile(0, 2, 0, 2) << "	    " << GetTile(0, 2, 1, 2) << "	   " << GetTile(0, 2, 2, 2) << "	|";
		cout << "    " << GetTile(1, 2, 0, 2) << "	    " << GetTile(1, 2, 1, 2) << "	   " << GetTile(1, 2, 2, 2) << "	|";
		cout << "    " << GetTile(2, 2, 0, 2) << "	    " << GetTile(2, 2, 1, 2) << "	   " << GetTile(2, 2, 2, 2) << "	\n";
	}
};

class Player //Base player class
{
	//variables (there are none)

	//friends
	friend class TicTacToe;

protected:
	//Constructor
	Player() {} //does nothing

	//Placeholders
	virtual string GetName() { return ""; } //does nothing
	virtual void PlayerMove(Board_9x9 &board, bool w) { system("pause"); } //does nothing

	//Set Functions

	//Get Functions																		
	int Check_CanWin(Board &board, bool w) //returns 0-8 for space, or 9 for can't win this round
	{
		Mark m; ///These Check_ functions are used by the Player_AI child class
		if (w)
			m = X_mark;
		else
			m = O_mark;

		if (Check_EmptyTile(board, 0, 0) && board.GetTile(0, 1) == m && board.GetTile(0, 2) == m ||
			Check_EmptyTile(board, 0, 0) && board.GetTile(1, 0) == m && board.GetTile(2, 0) == m ||
			Check_EmptyTile(board, 0, 0) && board.GetTile(1, 1) == m && board.GetTile(2, 2) == m)
			return 0;
		else if (Check_EmptyTile(board, 1, 0) && board.GetTile(1, 1) == m && board.GetTile(1, 2) == m ||
			Check_EmptyTile(board, 1, 0) && board.GetTile(0, 0) == m && board.GetTile(2, 0) == m)
			return 1;
		else if (Check_EmptyTile(board, 2, 0) && board.GetTile(2, 1) == m && board.GetTile(2, 2) == m ||
			Check_EmptyTile(board, 2, 0) && board.GetTile(1, 0) == m && board.GetTile(0, 0) == m ||
			Check_EmptyTile(board, 2, 0) && board.GetTile(1, 1) == m && board.GetTile(0, 2) == m)
			return 2;
		else if (Check_EmptyTile(board, 0, 1) && board.GetTile(0, 0) == m && board.GetTile(0, 2) == m ||
			Check_EmptyTile(board, 0, 1) && board.GetTile(1, 1) == m && board.GetTile(2, 1) == m)
			return 3;
		else if (Check_EmptyTile(board, 1, 1) && board.GetTile(1, 0) == m && board.GetTile(1, 2) == m ||
			Check_EmptyTile(board, 1, 1) && board.GetTile(0, 1) == m && board.GetTile(2, 1) == m ||
			Check_EmptyTile(board, 1, 1) && board.GetTile(0, 0) == m && board.GetTile(2, 2) == m ||
			Check_EmptyTile(board, 1, 1) && board.GetTile(0, 2) == m && board.GetTile(2, 0) == m)
			return 4;
		else if (Check_EmptyTile(board, 2, 1) && board.GetTile(2, 0) == m && board.GetTile(2, 2) == m ||
			Check_EmptyTile(board, 2, 1) && board.GetTile(1, 1) == m && board.GetTile(0, 1) == m)
			return 5;
		else if (Check_EmptyTile(board, 0, 2) && board.GetTile(0, 1) == m && board.GetTile(0, 0) == m ||
			Check_EmptyTile(board, 0, 2) && board.GetTile(1, 2) == m && board.GetTile(2, 2) == m ||
			Check_EmptyTile(board, 0, 2) && board.GetTile(1, 1) == m && board.GetTile(2, 0) == m)
			return 6;
		else if (Check_EmptyTile(board, 1, 2) && board.GetTile(1, 1) == m && board.GetTile(1, 0) == m ||
			Check_EmptyTile(board, 1, 2) && board.GetTile(0, 2) == m && board.GetTile(2, 2) == m)
			return 7;
		else if (Check_EmptyTile(board, 2, 2) && board.GetTile(2, 1) == m && board.GetTile(2, 0) == m ||
			Check_EmptyTile(board, 2, 2) && board.GetTile(1, 2) == m && board.GetTile(0, 2) == m ||
			Check_EmptyTile(board, 2, 2) && board.GetTile(1, 1) == m && board.GetTile(0, 0) == m)
			return 8;
		else
			return 9;
	}
	int Check_CanBlockWin(Board &board, bool w)
	{
		Mark m;
		if (w)
			m = O_mark;
		else
			m = X_mark;

		if (Check_EmptyTile(board, 0, 0) && board.GetTile(0, 1) == m && board.GetTile(0, 2) == m ||
			Check_EmptyTile(board, 0, 0) && board.GetTile(1, 0) == m && board.GetTile(2, 0) == m ||
			Check_EmptyTile(board, 0, 0) && board.GetTile(1, 1) == m && board.GetTile(2, 2) == m)
			return 0;
		else if (Check_EmptyTile(board, 1, 0) && board.GetTile(1, 1) == m && board.GetTile(1, 2) == m ||
			Check_EmptyTile(board, 1, 0) && board.GetTile(0, 0) == m && board.GetTile(2, 0) == m)
			return 1;
		else if (Check_EmptyTile(board, 2, 0) && board.GetTile(2, 1) == m && board.GetTile(2, 2) == m ||
			Check_EmptyTile(board, 2, 0) && board.GetTile(1, 0) == m && board.GetTile(0, 0) == m ||
			Check_EmptyTile(board, 2, 0) && board.GetTile(1, 1) == m && board.GetTile(0, 2) == m)
			return 2;
		else if (Check_EmptyTile(board, 0, 1) && board.GetTile(0, 0) == m && board.GetTile(0, 2) == m ||
			Check_EmptyTile(board, 0, 1) && board.GetTile(1, 1) == m && board.GetTile(2, 1) == m)
			return 3;
		else if (Check_EmptyTile(board, 1, 1) && board.GetTile(1, 0) == m && board.GetTile(1, 2) == m ||
			Check_EmptyTile(board, 1, 1) && board.GetTile(0, 1) == m && board.GetTile(2, 1) == m ||
			Check_EmptyTile(board, 1, 1) && board.GetTile(0, 0) == m && board.GetTile(2, 2) == m ||
			Check_EmptyTile(board, 1, 1) && board.GetTile(0, 2) == m && board.GetTile(2, 0) == m)
			return 4;
		else if (Check_EmptyTile(board, 2, 1) && board.GetTile(2, 0) == m && board.GetTile(2, 2) == m ||
			Check_EmptyTile(board, 2, 1) && board.GetTile(1, 1) == m && board.GetTile(0, 1) == m)
			return 5;
		else if (Check_EmptyTile(board, 0, 2) && board.GetTile(0, 1) == m && board.GetTile(0, 0) == m ||
			Check_EmptyTile(board, 0, 2) && board.GetTile(1, 2) == m && board.GetTile(2, 2) == m ||
			Check_EmptyTile(board, 0, 2) && board.GetTile(1, 1) == m && board.GetTile(2, 0) == m)
			return 6;
		else if (Check_EmptyTile(board, 1, 2) && board.GetTile(1, 1) == m && board.GetTile(1, 0) == m ||
			Check_EmptyTile(board, 1, 2) && board.GetTile(0, 2) == m && board.GetTile(2, 2) == m)
			return 7;
		else if (Check_EmptyTile(board, 2, 2) && board.GetTile(2, 1) == m && board.GetTile(2, 0) == m ||
			Check_EmptyTile(board, 2, 2) && board.GetTile(1, 2) == m && board.GetTile(0, 2) == m ||
			Check_EmptyTile(board, 2, 2) && board.GetTile(1, 1) == m && board.GetTile(0, 0) == m)
			return 8;
		else
			return 9;
	}
	int Check_CanFork(Board &board, bool w)
	{
		Mark m;
		if (w)
			m = X_mark;
		else
			m = O_mark;

		if (Check_EmptyTile(board, 1, 1) && (
			(((board.GetTile(0, 0) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 0, 0))) &&
			((board.GetTile(0, 2) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 0, 2)))) ||
			(((board.GetTile(0, 0) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 0, 0))) &&
			((board.GetTile(0, 1) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 0, 1)))) ||
			(((board.GetTile(0, 0) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 0, 0))) &&
			((board.GetTile(1, 0) == m && Check_EmptyTile(board, 1, 2)) || (board.GetTile(1, 2) == m && Check_EmptyTile(board, 1, 0)))) ||
			(((board.GetTile(0, 2) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 0, 2))) &&
			((board.GetTile(0, 1) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 0, 1)))) ||
			(((board.GetTile(0, 2) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 0, 2))) &&
			((board.GetTile(1, 0) == m && Check_EmptyTile(board, 1, 2)) || (board.GetTile(1, 2) == m && Check_EmptyTile(board, 1, 0)))) ||
			(((board.GetTile(1, 0) == m && Check_EmptyTile(board, 1, 2)) || (board.GetTile(1, 2) == m && Check_EmptyTile(board, 1, 0))) &&
			((board.GetTile(0, 1) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 0, 1))))))
			return 4;

		if (Check_EmptyTile(board, 0, 0) && board.GetTile(2, 2) == m && (Check_EmptyTile(board, 0, 1) && Check_EmptyTile(board, 0, 2) && 
			Check_EmptyTile(board, 1, 2) && Check_EmptyTile(board, 2, 1) && Check_EmptyTile(board, 2, 0) && Check_EmptyTile(board, 1, 0)))
			return 0;
		else if (Check_EmptyTile(board, 2, 0) && board.GetTile(0, 2) == m && (Check_EmptyTile(board, 0, 1) && Check_EmptyTile(board, 0, 0) &&
			Check_EmptyTile(board, 1, 2) && Check_EmptyTile(board, 2, 1) && Check_EmptyTile(board, 2, 2) && Check_EmptyTile(board, 1, 0)))
			return 2;
		else if (Check_EmptyTile(board, 0, 2) && board.GetTile(2, 0) == m && (Check_EmptyTile(board, 0, 1) && Check_EmptyTile(board, 0, 0) &&
			Check_EmptyTile(board, 1, 2) && Check_EmptyTile(board, 2, 1) && Check_EmptyTile(board, 2, 2) && Check_EmptyTile(board, 1, 0)))
			return 6;
		else if (Check_EmptyTile(board, 2, 2) && board.GetTile(0, 0) == m && (Check_EmptyTile(board, 0, 1) && Check_EmptyTile(board, 0, 2) &&
			Check_EmptyTile(board, 1, 2) && Check_EmptyTile(board, 2, 1) && Check_EmptyTile(board, 2, 0) && Check_EmptyTile(board, 1, 0)))
			return 8;

		int end = rand() % 4;
		for (int norm = end + 1; norm % 4 != end; norm++)
			if (Check_EmptyTile(board, 0, 0) && (
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(0, 1) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 0, 1)))) ||
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(1, 0) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 1, 0)))) ||
				(((board.GetTile(1, 0) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 1, 0))) &&
				((board.GetTile(0, 1) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 0, 1))))
				) && norm % 4 == 0)
				return 0;
			else if (Check_EmptyTile(board, 2, 0) && (
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(2, 1) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 2, 1)))) ||
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(1, 0) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 1, 0)))) ||
				(((board.GetTile(1, 0) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 1, 0))) &&
				((board.GetTile(2, 1) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 2, 1))))
				) && norm % 4 == 1)
				return 2;
			else if (Check_EmptyTile(board, 0, 2) && (
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(1, 2) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 1, 2)))) ||
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(0, 1) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 0, 1)))) ||
				(((board.GetTile(0, 1) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 0, 1))) &&
				((board.GetTile(1, 2) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 1, 2))))
				) && norm % 4 == 2)
				return 6;
			else if (Check_EmptyTile(board, 2, 2) && (
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(1, 2) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 1, 2)))) ||
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(2, 0) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 2, 0)))) ||
				(((board.GetTile(2, 0) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 2, 0))) &&
				((board.GetTile(1, 2) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 1, 2))))
				) && norm % 4 == 3)
				return 8;

		end = rand() % 4;
		for (int norm = end + 1; norm % 4 != end; norm++)
			if (Check_EmptyTile(board, 1, 0) && (
				((board.GetTile(0, 0) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 0, 0))) &&
				((board.GetTile(1, 1) == m && Check_EmptyTile(board, 1, 2)) || (board.GetTile(1, 2) == m && Check_EmptyTile(board, 1, 1)))
				) && norm % 4 == 0)
				return 1;
			else if (Check_EmptyTile(board, 0, 1) && (
				((board.GetTile(1, 1) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(0, 0) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 0, 0)))
				) && norm % 4 == 1)
				return 3;
			else if (Check_EmptyTile(board, 2, 1) && (
				((board.GetTile(2, 0) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 2, 0))) &&
				((board.GetTile(0, 1) == m && Check_EmptyTile(board, 1, 1)) || (board.GetTile(1, 1) == m && Check_EmptyTile(board, 0, 1)))
				) && norm % 4 == 2)
				return 5;
			else if (Check_EmptyTile(board, 1, 2) && (
				((board.GetTile(0, 2) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 0, 2))) &&
				((board.GetTile(1, 1) == m && Check_EmptyTile(board, 1, 0)) || (board.GetTile(1, 0) == m && Check_EmptyTile(board, 1, 1)))
				) && norm % 4 == 3)
				return 7;

		return 9;
	}
	int Check_CanBlockFork(Board &board, bool w)
	{
		Mark m, e;
		if (w)
		{
			m = O_mark;
			e = X_mark;
		}
		else
		{
			m = X_mark;
			e = O_mark;
		}

		if (Check_EmptyTile(board, 1, 1) && (
			(((board.GetTile(0, 0) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 0, 0))) &&
			((board.GetTile(0, 2) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 0, 2)))) ||
			(((board.GetTile(0, 0) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 0, 0))) &&
			((board.GetTile(0, 1) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 0, 1)))) ||
			(((board.GetTile(0, 0) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 0, 0))) &&
			((board.GetTile(1, 0) == m && Check_EmptyTile(board, 1, 2)) || (board.GetTile(1, 2) == m && Check_EmptyTile(board, 1, 0)))) ||
			(((board.GetTile(0, 2) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 0, 2))) &&
			((board.GetTile(0, 1) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 0, 1)))) ||
			(((board.GetTile(0, 2) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 0, 2))) &&
			((board.GetTile(1, 0) == m && Check_EmptyTile(board, 1, 2)) || (board.GetTile(1, 2) == m && Check_EmptyTile(board, 1, 0)))) ||
			(((board.GetTile(1, 0) == m && Check_EmptyTile(board, 1, 2)) || (board.GetTile(1, 2) == m && Check_EmptyTile(board, 1, 0))) &&
			((board.GetTile(0, 1) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 0, 1))))))
			return 4;
		
		int end = rand() % 4;
		for (int norm = end + 1; norm % 4 != end; norm ++)
			if (board.GetTile(1, 1) == e && Check_EmptyTile(board, 1, 0) && (
				board.GetTile(0, 0) == m && board.GetTile(2, 2) == m && 
				((Check_EmptyTile(board, 0, 1) && Check_EmptyTile(board, 0, 2) && Check_EmptyTile(board, 1, 2)) ||
				Check_EmptyTile(board, 1, 0) && Check_EmptyTile(board, 2, 0) && Check_EmptyTile(board, 2, 1))
				|| 
				board.GetTile(2, 0) == m && board.GetTile(0, 2) == m && 
				((Check_EmptyTile(board, 2, 1) && Check_EmptyTile(board, 2, 2) && Check_EmptyTile(board, 1, 2)) ||
				(Check_EmptyTile(board, 1, 0) && Check_EmptyTile(board, 0, 0) && Check_EmptyTile(board, 0, 1))))
				&& norm % 4 == 0)
				return 1;
			else if (board.GetTile(1, 1) == e && Check_EmptyTile(board, 0, 1) && (
				board.GetTile(0, 0) == m && board.GetTile(2, 2) == m &&
				((Check_EmptyTile(board, 0, 1) && Check_EmptyTile(board, 0, 2) && Check_EmptyTile(board, 1, 2)) ||
				(Check_EmptyTile(board, 1, 0) && Check_EmptyTile(board, 2, 0) && Check_EmptyTile(board, 2, 1)))
				||
				board.GetTile(2, 0) == m && board.GetTile(0, 2) == m &&
				((Check_EmptyTile(board, 2, 1) && Check_EmptyTile(board, 2, 2) && Check_EmptyTile(board, 1, 2)) ||
				(Check_EmptyTile(board, 1, 0) && Check_EmptyTile(board, 0, 0) && Check_EmptyTile(board, 0, 1))))
				&& norm % 4 == 1)
				return 3;
			else if (board.GetTile(1, 1) == e && Check_EmptyTile(board, 2, 1) && (
				board.GetTile(0, 0) == m && board.GetTile(2, 2) == m &&
				((Check_EmptyTile(board, 0, 1) && Check_EmptyTile(board, 0, 2) && Check_EmptyTile(board, 1, 2)) ||
				(Check_EmptyTile(board, 1, 0) && Check_EmptyTile(board, 2, 0) && Check_EmptyTile(board, 2, 1)))
				||
				board.GetTile(2, 0) == m && board.GetTile(0, 2) == m &&
				((Check_EmptyTile(board, 2, 1) && Check_EmptyTile(board, 2, 2) && Check_EmptyTile(board, 1, 2)) ||
				(Check_EmptyTile(board, 1, 0) && Check_EmptyTile(board, 0, 0) && Check_EmptyTile(board, 0, 1))))
				&& norm % 4 == 2)
				return 5;
			else if (board.GetTile(1, 1) == e && Check_EmptyTile(board, 1, 2) && (
				board.GetTile(0, 0) == m && board.GetTile(2, 2) == m &&
				((Check_EmptyTile(board, 0, 1) && Check_EmptyTile(board, 0, 2) && Check_EmptyTile(board, 1, 2)) ||
				(Check_EmptyTile(board, 1, 0) && Check_EmptyTile(board, 2, 0) && Check_EmptyTile(board, 2, 1)))
				||
				board.GetTile(2, 0) == m && board.GetTile(0, 2) == m &&
				((Check_EmptyTile(board, 2, 1) && Check_EmptyTile(board, 2, 2) && Check_EmptyTile(board, 1, 2)) ||
				(Check_EmptyTile(board, 1, 0) && Check_EmptyTile(board, 0, 0) && Check_EmptyTile(board, 0, 1))))
				&& norm % 4 == 3)
				return 7;

		end = rand() % 4;
		for (int norm = end + 1; norm % 4 != end; norm++)
			if (Check_EmptyTile(board, 0, 0) && (
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(0, 1) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 0, 1)))) ||
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(1, 0) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 1, 0)))) ||
				(((board.GetTile(1, 0) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 1, 0))) &&
				((board.GetTile(0, 1) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 0, 1))))
				) && norm % 4 == 0)
				return 0;
			else if (Check_EmptyTile(board, 2, 0) && (
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(2, 1) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 2, 1)))) ||
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(1, 0) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 1, 0)))) ||
				(((board.GetTile(1, 0) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 1, 0))) &&
				((board.GetTile(2, 1) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 2, 1))))
				) && norm % 4 == 1)
				return 2;
			else if (Check_EmptyTile(board, 0, 2) && (
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(1, 2) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 1, 2)))) ||
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(0, 1) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 0, 1)))) ||
				(((board.GetTile(0, 1) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 0, 1))) &&
				((board.GetTile(1, 2) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 1, 2))))
				) && norm % 4 == 2)
				return 6;
			else if (Check_EmptyTile(board, 2, 2) && (
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(1, 2) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 1, 2)))) ||
				(((board.GetTile(1, 1) == m && Check_EmptyTile(board, 0, 0)) || (board.GetTile(0, 0) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(2, 0) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 2, 0)))) ||
				(((board.GetTile(2, 0) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 2, 0))) &&
				((board.GetTile(1, 2) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 1, 2))))
				) && norm % 4 == 3)
				return 8;

		end = rand() % 4;
		for (int norm = end + 1; norm % 4 != end; norm++)
			if (Check_EmptyTile(board, 1, 0) && (
				((board.GetTile(0, 0) == m && Check_EmptyTile(board, 2, 0)) || (board.GetTile(2, 0) == m && Check_EmptyTile(board, 0, 0))) &&
				((board.GetTile(1, 1) == m && Check_EmptyTile(board, 1, 2)) || (board.GetTile(1, 2) == m && Check_EmptyTile(board, 1, 1)))
				) && norm % 4 == 0)
				return 1;
			else if (Check_EmptyTile(board, 0, 1) && (
				((board.GetTile(1, 1) == m && Check_EmptyTile(board, 2, 1)) || (board.GetTile(2, 1) == m && Check_EmptyTile(board, 1, 1))) &&
				((board.GetTile(0, 0) == m && Check_EmptyTile(board, 0, 2)) || (board.GetTile(0, 2) == m && Check_EmptyTile(board, 0, 0)))
				) && norm % 4 == 1)
				return 3;
			else if (Check_EmptyTile(board, 2, 1) && (
				((board.GetTile(2, 0) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 2, 0))) &&
				((board.GetTile(0, 1) == m && Check_EmptyTile(board, 1, 1)) || (board.GetTile(1, 1) == m && Check_EmptyTile(board, 0, 1)))
				) && norm % 4 == 2)
				return 5;
			else if (Check_EmptyTile(board, 1, 2) && (
				((board.GetTile(0, 2) == m && Check_EmptyTile(board, 2, 2)) || (board.GetTile(2, 2) == m && Check_EmptyTile(board, 0, 2))) &&
				((board.GetTile(1, 1) == m && Check_EmptyTile(board, 1, 0)) || (board.GetTile(1, 0) == m && Check_EmptyTile(board, 1, 1)))
				) && norm % 4 == 3)
				return 7;

		return 9;
	}
	int Check_CanCenter(Board &board)
	{
		if (Check_EmptyTile(board, 1, 1))
			return 4;
		else
			return 9;
	}
	int Check_CanOppositeCorner(Board &board, bool w)
	{
		Mark m;
		if (w)
			m = O_mark;
		else
			m = X_mark;

		if (Check_EmptyTile(board, 0, 0) && board.GetTile(2, 2) == m)
			return 0;
		else if (Check_EmptyTile(board, 2, 0) && board.GetTile(0, 2) == m)
			return 2;
		else if (Check_EmptyTile(board, 0, 2) && board.GetTile(2, 0) == m)
			return 6;
		else if (Check_EmptyTile(board, 2, 2) && board.GetTile(0, 0) == m)
			return 8;

		return 9;
	}
	int Check_CanEmptyCorner(Board &board)
	{
		int end = rand() % 4;
		for (int norm = end + 1; norm % 4 != end; norm++)
			if (Check_EmptyTile(board, 0, 0) && norm % 4 == 0)
				return 0;
			else if (Check_EmptyTile(board, 2, 0) && norm % 4 == 1)
				return 2;
			else if (Check_EmptyTile(board, 0, 2) && norm % 4 == 2)
				return 6;
			else if (Check_EmptyTile(board, 2, 2) && norm % 4 == 3)
				return 8;

		return 9;
	}
	int Check_CanEmptySide(Board &board)
	{
		int end = rand() % 4;
		for (int norm = end + 1; norm % 4 != end; norm++)
			if (Check_EmptyTile(board, 1, 0) && norm % 4 == 0)
				return 1;
			else if (Check_EmptyTile(board, 0, 1) && norm % 4 == 1)
				return 3;
			else if (Check_EmptyTile(board, 2, 1) && norm % 4 == 2)
				return 5;
			else if (Check_EmptyTile(board, 1, 2) && norm % 4 == 3)
				return 7;

		return 9;
	}
	int Check_ValueChoice(Board &board)
	{
		int value[9], options[9], num_of_options = 0;

		value[0] = (4 - board.Get_TurnsToWin(true, 0)) + (4 - board.Get_TurnsToWin(true, 3)) + (4 - board.Get_TurnsToWin(true, 6));
		value[1] = (4 - board.Get_TurnsToWin(true, 1)) + (4 - board.Get_TurnsToWin(true, 3));
		value[2] = (4 - board.Get_TurnsToWin(true, 2)) + (4 - board.Get_TurnsToWin(true, 3)) + (4 - board.Get_TurnsToWin(true, 7));
		value[3] = (4 - board.Get_TurnsToWin(true, 0)) + (4 - board.Get_TurnsToWin(true, 4));
		value[4] = (4 - board.Get_TurnsToWin(true, 1)) + (4 - board.Get_TurnsToWin(true, 4)) + (4 - board.Get_TurnsToWin(true, 6)) + (4 - board.Get_TurnsToWin(true, 7));
		value[5] = (4 - board.Get_TurnsToWin(true, 2)) + (4 - board.Get_TurnsToWin(true, 4));
		value[6] = (4 - board.Get_TurnsToWin(true, 0)) + (4 - board.Get_TurnsToWin(true, 5)) + (4 - board.Get_TurnsToWin(true, 7));
		value[7] = (4 - board.Get_TurnsToWin(true, 1)) + (4 - board.Get_TurnsToWin(true, 5));
		value[8] = (4 - board.Get_TurnsToWin(true, 2)) + (4 - board.Get_TurnsToWin(true, 5)) + (4 - board.Get_TurnsToWin(true, 6));

		value[0] += (4 - board.Get_TurnsToWin(false, 0)) + (4 - board.Get_TurnsToWin(false, 3)) + (4 - board.Get_TurnsToWin(false, 6));
		value[1] += (4 - board.Get_TurnsToWin(false, 1)) + (4 - board.Get_TurnsToWin(false, 3));
		value[2] += (4 - board.Get_TurnsToWin(false, 2)) + (4 - board.Get_TurnsToWin(false, 3)) + (4 - board.Get_TurnsToWin(false, 7));
		value[3] += (4 - board.Get_TurnsToWin(false, 0)) + (4 - board.Get_TurnsToWin(false, 4));
		value[4] += (4 - board.Get_TurnsToWin(false, 1)) + (4 - board.Get_TurnsToWin(false, 4)) + (4 - board.Get_TurnsToWin(false, 6)) + (4 - board.Get_TurnsToWin(false, 7));
		value[5] += (4 - board.Get_TurnsToWin(false, 2)) + (4 - board.Get_TurnsToWin(false, 4));
		value[6] += (4 - board.Get_TurnsToWin(false, 0)) + (4 - board.Get_TurnsToWin(false, 5)) + (4 - board.Get_TurnsToWin(false, 7));
		value[7] += (4 - board.Get_TurnsToWin(false, 1)) + (4 - board.Get_TurnsToWin(false, 5));
		value[8] += (4 - board.Get_TurnsToWin(false, 2)) + (4 - board.Get_TurnsToWin(false, 5)) + (4 - board.Get_TurnsToWin(false, 6));

		for (int i = 0; i < 9; i++)
			if (!Check_EmptyTile(board, i % 3, (i / 3) % 3))
				value[i] = 0;

		for (int i = 12; i > 0; i--)
		{
			for (int j = 0; j < 9; j++)
			{
				if (value[j] == i)
				{
					options[num_of_options] = j;
					num_of_options++;
				}
			}
			if (num_of_options > 0)
				break;
		}
		
		if(num_of_options > 0)
			return options[rand() % num_of_options];
		return 9;
	}
	bool Check_EmptyTile(Board &board, int x, int y)
	{
		return board.Check_EmptyTile(x, y);
	}

};
class Player_AI : public Player //AI player
{
	//variables
	int level;

	//friends
	friend class TicTacToe;

private:
	//Constructor
	Player_AI() {}
	Player_AI(int l) { SetAILevel(l); }

	//Operation Functions
	void PlayerMove(Board_9x9 &board, bool which_player)
	{
		int x_coord, y_coord, temp_coord = 9;
		
		int value[9], options[9], num_of_options = 0;
		Mark m, temp_mark;

		if (which_player)
			m = X_mark;
		else
			m = O_mark;
		
		if (rand() % level + level > 6 || (rand() % level + level > 4 && rand() % 2 == 0))
		{
			for (int i = 0; i < 9; i++)
			{
				if (board.GetTile(i % 3, (i / 3) % 3) == Winnable)
				{
					options[num_of_options] = i;
					num_of_options++;
				}
			}
			if (num_of_options > 0)
				temp_coord = options[rand() % num_of_options];
		}
		if (temp_coord == 9 && (rand() % level + level > 4) || (rand() % level + level > 2 && rand() % 2 == 0))
		{
			if (m == X_mark)
				temp_mark = X_blockable;
			else
				temp_mark = O_blockable;
			
			for (int i = 0; i < 9; i++)
				if (board.GetTile(i % 3, (i / 3) % 3) == temp_mark)
				{
					options[num_of_options] = i;
					num_of_options++;
				}
			
			if (num_of_options > 0)
				temp_coord = options[rand() % num_of_options];
		}
		if (temp_coord == 9 && (rand() % level + level > 14 || (rand() % level + level > 9 && rand() % 2 == 0)))
		{
			if (m == X_mark)
				temp_mark = O_blockable;
			else
				temp_mark = X_blockable;

			for (int i = 0; i < 9; i++)
				if (board.GetTile(i % 3, (i / 3) % 3) == temp_mark)
				{
					options[num_of_options] = i;
					num_of_options++;
				}

			if (num_of_options > 0)
				temp_coord = options[rand() % num_of_options];
		}
		if (temp_coord == 9)
		{
			value[0] = (4 - board.GetTurns(true, 0)) + (4 - board.GetTurns(true, 3)) + (4 - board.GetTurns(true, 6));
			value[1] = (4 - board.GetTurns(true, 1)) + (4 - board.GetTurns(true, 3));
			value[2] = (4 - board.GetTurns(true, 2)) + (4 - board.GetTurns(true, 3)) + (4 - board.GetTurns(true, 7));
			value[3] = (4 - board.GetTurns(true, 0)) + (4 - board.GetTurns(true, 4));
			value[4] = (4 - board.GetTurns(true, 1)) + (4 - board.GetTurns(true, 4)) + (4 - board.GetTurns(true, 6)) + (4 - board.GetTurns(true, 7));
			value[5] = (4 - board.GetTurns(true, 2)) + (4 - board.GetTurns(true, 4));
			value[6] = (4 - board.GetTurns(true, 0)) + (4 - board.GetTurns(true, 5)) + (4 - board.GetTurns(true, 7));
			value[7] = (4 - board.GetTurns(true, 1)) + (4 - board.GetTurns(true, 5));
			value[8] = (4 - board.GetTurns(true, 2)) + (4 - board.GetTurns(true, 5)) + (4 - board.GetTurns(true, 6));

			value[0] += (4 - board.GetTurns(false, 0)) + (4 - board.GetTurns(false, 3)) + (4 - board.GetTurns(false, 6));
			value[1] += (4 - board.GetTurns(false, 1)) + (4 - board.GetTurns(false, 3));
			value[2] += (4 - board.GetTurns(false, 2)) + (4 - board.GetTurns(false, 3)) + (4 - board.GetTurns(false, 7));
			value[3] += (4 - board.GetTurns(false, 0)) + (4 - board.GetTurns(false, 4));
			value[4] += (4 - board.GetTurns(false, 1)) + (4 - board.GetTurns(false, 4)) + (4 - board.GetTurns(false, 6)) + (4 - board.GetTurns(false, 7));
			value[5] += (4 - board.GetTurns(false, 2)) + (4 - board.GetTurns(false, 4));
			value[6] += (4 - board.GetTurns(false, 0)) + (4 - board.GetTurns(false, 5)) + (4 - board.GetTurns(false, 7));
			value[7] += (4 - board.GetTurns(false, 1)) + (4 - board.GetTurns(false, 5));
			value[8] += (4 - board.GetTurns(false, 2)) + (4 - board.GetTurns(false, 5)) + (4 - board.GetTurns(false, 6));

			for (int i = 0; i < 9; i++)
				if (!Player::Check_EmptyTile(board, i % 3, (i / 3) % 3))
					value[i] = -1;

			if (rand() % level + level > 14 || (rand() % level + level > 9 && rand() % 2 == 0))
			{
				for (int i = 0; i < 9; i++)
				{
					if (m == X_mark)
						temp_mark = X_advantage;
					else
						temp_mark = O_advantage;

					if (board.GetTile(i % 3, (i / 3) % 3) == temp_mark)
					{
						value[i] = -1;

						for (int j = 0; j < 9; j++)
						{
							if (i % 3 == j % 3 && value[j] != -1)
								value[j]++;
							if ((i / 3) % 3 == (j / 3) % 3 && value[j] != -1)
								value[j]++;
							if (i % 4 == 0 && j % 4 == 0 && value[j] != -1)
								value[j]++;
							if ((i % 3 + (i / 3) % 3 == 2) && (j % 3 + (j / 3) % 3 == 2) && value[j] != -1)
								value[j]++;
						}
					}
				}
			}
			if (rand() % level + level > 9 || (rand() % level + level > 6 && rand() % 2 == 0))
			{
				for (int i = 0; i < 9; i++)
				{
					if (m == X_mark)
						temp_mark = X_fork;
					else
						temp_mark = O_fork;

					if (board.GetTile(i % 3, (i / 3) % 3) == temp_mark)
					{
						value[i] = -1;

						for (int j = 0; j < 9; j++)
						{
							if (i % 3 == j % 3 && value[j] != -1)
								value[j]++;
							if ((i / 3) % 3 == (j / 3) % 3 && value[j] != -1)
								value[j]++;
							if (i % 4 == 0 && j % 4 == 0 && value[j] != -1)
								value[j]++;
							if ((i % 3 + (i / 3) % 3 == 2) && (j % 3 + (j / 3) % 3 == 2) && value[j] != -1)
								value[j]++;
						}
					}
				}
			}
			if (rand() % level + level > 9 || (rand() % level + level > 6 && rand() % 2 == 0))
			{
				for (int i = 0; i < 9; i++)
				{
					if (m == X_mark)
						temp_mark = O_advantage;
					else
						temp_mark = X_advantage;

					if (board.GetTile(i % 3, (i / 3) % 3) == temp_mark)
					{
						value[i] = -1;

						for (int j = 0; j < 9; j++)
						{
							if (i % 3 == j % 3 && value[j] != -1)
								value[j]++;
							if ((i / 3) % 3 == (j / 3) % 3 && value[j] != -1)
								value[j]++;
							if (i % 4 == 0 && j % 4 == 0 && value[j] != -1)
								value[j]++;
							if ((i % 3 + (i / 3) % 3 == 2) && (j % 3 + (j / 3) % 3 == 2) && value[j] != -1)
								value[j]++;
						}
					}
				}
			}
			if (rand() % level + level > 6 || (rand() % level + level > 4 && rand() % 2 == 0))
			{
				for (int i = 0; i < 9; i++)
				{
					if (m == X_mark)
						temp_mark = O_fork;
					else
						temp_mark = X_fork;

					if (board.GetTile(i % 3, (i / 3) % 3) == temp_mark)
					{
						value[i] = -1;

						for (int j = 0; j < 9; j++)
						{
							if (i % 3 == j % 3 && value[j] != -1)
								value[j]++;
							if ((i / 3) % 3 == (j / 3) % 3 && value[j] != -1)
								value[j]++;
							if (i % 4 == 0 && j % 4 == 0 && value[j] != -1)
								value[j]++;
							if ((i % 3 + (i / 3) % 3 == 2) && (j % 3 + (j / 3) % 3 == 2) && value[j] != -1)
								value[j]++;
						}
					}
				}
			}
			if (rand() % level + level > 4 || (rand() % level + level > 2 && rand() % 2 == 0))
			{
				for (int i = 0; i < 9; i++)
				{
					if (m == X_mark)
						temp_mark = O_mark;
					else
						temp_mark = X_mark;

					if (board.Check_Winnable(i % 3, (i / 3) % 3, temp_mark) && value[i] != -1)
					{
						value[i] = +1;
					}
				}
			}
			if (rand() % level + level > 2)
			{
				for (int i = 0; i < 9; i++)
				{
					if (m == X_mark)
						temp_mark = X_mark;
					else
						temp_mark = O_mark;

					if (board.Check_Winnable(i % 3, (i / 3) % 3, temp_mark) && value[i] != -1)
					{
						value[i] = +1;
					}
				}
			}

			for (int i = 20; i > 0; i--)
			{
				for (int j = 0; j < 9; j++)
				{
					if (value[j] == i)
					{
						options[num_of_options] = j;
						num_of_options++;
					}
				}
				if (num_of_options > 0)
					break;
			}

			if (num_of_options > 0)
				temp_coord = options[rand() % num_of_options];
		}

		if (temp_coord != 9)
		{
			x_coord = temp_coord % 3;
			y_coord = (temp_coord / 3) % 3;
		}
		else
		{
			do
			{
				x_coord = rand() % 3;
				y_coord = rand() % 3;
			} while (!Player::Check_EmptyTile(board.GetBoard(), x_coord, y_coord));
		}

		PlayerMovePart2(board, x_coord, y_coord, board.GetBoard(x_coord, y_coord), which_player);
	}
	void PlayerMovePart2(Board_9x9 &b, int zx, int zy, Board &board, bool which_player)
	{
		int x_coord, y_coord, temp_coord;
		////////////my brrrilliant level scaled AI instructions. also, all these functions call the parent function
		if (Player::Check_ValueChoice(board) < 9 && rand() % level + level > 15)
			temp_coord = Player::Check_ValueChoice(board);
		else if (Player::Check_CanWin(board, which_player) < 9 && rand() % level + level > 4) ///because this class isn't friends
			temp_coord = Player::Check_CanWin(board, which_player);//////////////with the board. so it can't really see it
		else if (Player::Check_CanBlockWin(board, which_player) < 9 && rand() % level + level > 4)
			temp_coord = Player::Check_CanBlockWin(board, which_player);
		else if (Player::Check_CanFork(board, which_player) < 9 && ((rand() % level + level > 6 && rand() % 2 == 0) || rand() % level + level > 9))
			temp_coord = Player::Check_CanFork(board, which_player);
		else if (Player::Check_CanBlockFork(board, which_player) < 9 && ((rand() % level + level > 6 && rand() % 2 == 0) || rand() % level + level > 9))
			temp_coord = Player::Check_CanBlockFork(board, which_player);
		else if (Player::Check_CanCenter(board) < 9 && (rand() % level + level > 4 || (rand() % level + level > 2 && rand() % 2 == 0)))
			temp_coord = Player::Check_CanCenter(board);
		else if (Player::Check_CanOppositeCorner(board, which_player) < 9 && rand() % level + level > 6)
			temp_coord = Player::Check_CanOppositeCorner(board, which_player);
		else if (Player::Check_CanEmptyCorner(board) < 9 && rand() % level + level > 2)
			temp_coord = Player::Check_CanEmptyCorner(board);
		else if (Player::Check_CanEmptySide(board) < 9 && rand() % level + level > 2)
			temp_coord = Player::Check_CanEmptySide(board);
		else
			temp_coord = 9; ///the temp coord is a 0-8 placeholder for the 9 spaces. 9 value is for random space

		switch (temp_coord)
		{
		case 0:
		{
			x_coord = 0;
			y_coord = 0;
			break;
		}
		case 1:
		{
			x_coord = 1;
			y_coord = 0;
			break;
		}
		case 2:
		{
			x_coord = 2;
			y_coord = 0;
			break;
		}
		case 3:
		{
			x_coord = 0;
			y_coord = 1;
			break;
		}
		case 4:
		{
			x_coord = 1;
			y_coord = 1;
			break;
		}
		case 5:
		{
			x_coord = 2;
			y_coord = 1;
			break;
		}
		case 6:
		{
			x_coord = 0;
			y_coord = 2;
			break;
		}
		case 7:
		{
			x_coord = 1;
			y_coord = 2;
			break;
		}
		case 8:
		{
			x_coord = 2;
			y_coord = 2;
			break;
		}
		default:
		{
			do
			{
				x_coord = rand() % 3;
				y_coord = rand() % 3;
			} while (!Player::Check_EmptyTile(board, x_coord, y_coord));
			break;
		}
		}

		b.MarkTile(zx, zy, x_coord, y_coord, which_player);

		system("pause");
	}

	//Set Functions
	void SetAILevel(int l) { level = l; }

	//Get Functions
	string GetName() { return "Level " + to_string(level) + ' ' + 'A' + 'I'; } 

};
class Player_User : public Player //User player
{
	//variables
	string name;

	//friends
	friend class TicTacToe;

private:
	//Constructor
	Player_User() {}
	Player_User(string n) { NamePlayer(n); }

	//Operation Functions
	void PlayerMove(Board_9x9 &board, bool which_player)
	{
		string user_input;
		int x_coord = NULL, y_coord = NULL;
		char x_char = 3, y_char = 3;

		cout << "Enter the X and Y coordinates (in that order) of the board to play on\nor 'Q' to scoop: ";
		getline(cin, user_input);

		if (user_input.find_first_of("Qq") != std::string::npos)
			Scoop(board, which_player);
		else
		{
			x_coord = user_input.find_first_of("012");
			if(x_coord != std::string::npos)
				x_char = user_input.at(x_coord);

			y_coord = user_input.find_last_of("012");
			if (y_coord != std::string::npos)
				y_char = user_input.at(y_coord);

			switch (x_char)
			{
			case '0':
				x_coord = 0;
				break;
			case '1':
				x_coord = 1;
				break;
			case '2':
				x_coord = 2;
				break;
			case '3':
				cout << "\n\t\tInvalid position!";
				cin.get(); /////this keeps the program from crashing. Super Important!!! 
				PlayerMove(board, which_player); ///(I think it catches leftover garbage from last input)
			default:
				x_coord = rand() % 3;
				break;
			}

			switch (y_char)
			{
			case '0':
				y_coord = 0;
				break;
			case '1':
				y_coord = 1;
				break;
			case '2':
				y_coord = 2;
				break;
			case '3':
				cout << "\n\t\tInvalid position!";
				cin.get(); /////this keeps the program from crashing. Super Important!!! 
				PlayerMove(board, which_player); ///(I think it catches leftover garbage from last input)
			default:
				x_coord = rand() % 3;
				break;
			}

			if (Player::Check_EmptyTile(board.GetBoard(), x_coord, y_coord))
				PlayerMovePart2(board, x_coord, y_coord, board.GetBoard(x_coord, y_coord), which_player);
			else
			{
				cout << "\n\t\tInvalid position!";
				cin.get(); /////this keeps the program from crashing. Super Important!!! 
				PlayerMove(board, which_player); ///(I think it catches leftover garbage from last input)
			}
		}
	}
	void PlayerMovePart2(Board_9x9 &b, int zx, int zy, Board &board, bool which_player)
	{
		string user_input;
		int x_coord = NULL, y_coord = NULL;
		char x_char = 3, y_char = 3;

		cout << "Enter the X and Y coordinates (in that order) of the tile you want: ";
		getline(cin, user_input);

		x_coord = user_input.find_first_of("012");
		if (x_coord != std::string::npos)
			x_char = user_input.at(x_coord);

		y_coord = user_input.find_last_of("012");
		if (y_coord != std::string::npos)
			y_char = user_input.at(y_coord);

		switch (x_char)
		{
		case '0':
			x_coord = 0;
			break;
		case '1':
			x_coord = 1;
			break;
		case '2':
			x_coord = 2;
			break;
		case '3':
			cout << "\n\t\tInvalid position!";
			cin.get(); /////this keeps the program from crashing. Super Important!!! 
			PlayerMovePart2(b, zx, zy, board, which_player); ///(I think it catches leftover garbage from last input)
		default:
			x_coord = rand() % 3;
			break;
		}

		switch (y_char)
		{
		case '0':
			y_coord = 0;
			break;
		case '1':
			y_coord = 1;
			break;
		case '2':
			y_coord = 2;
			break;
		case '3':
			cout << "\n\t\tInvalid position!";
			cin.get(); /////this keeps the program from crashing. Super Important!!! 
			PlayerMovePart2(b, zx, zy, board, which_player); ///(I think it catches leftover garbage from last input)
		default:
			x_coord = rand() % 3;
			break;
		}

		if (Player::Check_EmptyTile(board, x_coord, y_coord))
			b.MarkTile(zx, zy, x_coord, y_coord, which_player);
		else
		{
			cout << "\n\t\tInvalid position!";
			cin.get(); /////this keeps the program from crashing. Super Important!!! 
			PlayerMovePart2(b, zx, zy, board, which_player); ///(I think it catches leftover garbage from last input)
		}
	}
	void Scoop(Board_9x9 &b, bool which_player)
	{
		for (int zx = 0; zx < 3; zx++)
			for (int zy = 0; zy < 3; zy++)
				for (int x_coord = 0; x_coord < 3; x_coord++)
					for (int y_coord = 0; y_coord < 3; y_coord++)
						b.MarkTile(zx, zy, x_coord, y_coord, !which_player);
	}

	//Set Functions
	void NamePlayer(string n) { name = n; }

	//Get Functions
	string GetName() { return name; }
};

class TicTacToe //Controller
{
	//variables
	Board_9x9 board;
	Player** player = new Player*[2]; //a "pointer to an array of Player or derived types"
	bool x_Turn; //keeps track of who's turn it is

private:
	//Operations
	bool CoinFlip() { return rand() % 2; }
	void SetPlayer(string name, bool player_1) { player[player_1] = new Player_User(name); }
	void SetPlayer(int level, bool player_1) { player[player_1] = new Player_AI(level); }

	//Output Functions
	void TitleScreen() //just a nice ascii title
	{
		system("CLS");
		cout << "\n\t___      ___      ___      ";
		cout << "\n\t |  o  _  |  _  _  |  _  _ ";
		cout << "\n\t |  | (_  | (_|(_  | (_)(/_\n\n";
	}
	void EnterPlayers() /////Allows user to choose who is playing
	{////////////////////////1 user and 1 computer? 2 users? or 2 computers?
		char choice;
		string name; /////////also gives the players a name
		int level; ///////////or the computer players a level

		cout << "\nEnter 'H' for Human player_x or 'C' for Computer player_x: "; ///player 1
		cin >> choice;

		if (toupper(choice) == 'H')
		{
			cout << "Enter player's name: ";
			cin >> name;
			SetPlayer(name, true); ////sets player 1 to be a User
		}
		else
		{
			cout << "Enter Computer player's level (1-9): ";
			cin >> level; ////////scaling difficulty level 1-9 
			if (level < 1) ///////level 9 can rarely make mistakes theoretically making it possible to beat
				level = 1;
			else if (level > 9 && level != 15) //secret level 15 for a perfect AI, impossible to beat
				level = 9;
			SetPlayer(level, true); ///sets player 1 to be an AI
		}

		cout << "\nEnter 'H' for Human player_o or 'C' for Computer player_o: "; /////player 2
		cin >> choice;

		if (toupper(choice) == 'H')
		{
			cout << "Enter player's name: ";
			cin >> name;
			SetPlayer(name, false); //sets player 2 to be a user
		}
		else
		{
			cout << "Enter Computer player's level (1-9): ";
			cin >> level;
			if (level < 1)
				level = 1;
			else if (level > 9 && level != 15)
				level = 9;
			SetPlayer(level, false); //sets player 2 to be an AI
		}

		cout << endl << endl;
	}
	void WhoGoesFirst() { cout << "\nAccording to the coin toss, " << player[!x_Turn]->GetName() << " goes first.\n"; }
	void OutputBoard() //this function outputs the board as normal on each player's turn
	{
		//system("CLS");//clears console window

		cout << player[!x_Turn]->GetName() << "'s Turn\n"; /////either Player_User or Player_AI

		board.OutputBoardState();
	}
	void DeclareWinner(int winner)
	{
		OutputBoard();

		if (winner == 2)
			cout << "\n\nTie Game! Nobody wins.";
		else
			cout << "\nPlayer: " << player[winner]->GetName() << " wins!";
	}

public:
	//Constructor
	TicTacToe() { srand(time(NULL)); } //makes rand() more random.

									   //operations
	void BeginGame()
	{
		TitleScreen(); //shows the ascii title
		EnterPlayers(); //allows user to determine players
	}
	void StartRound()
	{
		board.ClearBoard(); //clear the board
		x_Turn = CoinFlip(); //determine who goes first
		WhoGoesFirst(); //output who goes first
	}
	void Player_Turn()
	{
		OutputBoard();

		player[!x_Turn]->PlayerMove(board, x_Turn); //does player's turn

		x_Turn = !x_Turn;
	}
	bool CheckWinner()
	{
		board.CheckBoard();
		
		if (board.GetTile(0, 0) == X_mark && board.GetTile(0, 1) == X_mark && board.GetTile(0, 2) == X_mark ||
			board.GetTile(1, 0) == X_mark && board.GetTile(1, 1) == X_mark && board.GetTile(1, 2) == X_mark ||
			board.GetTile(2, 0) == X_mark && board.GetTile(2, 1) == X_mark && board.GetTile(2, 2) == X_mark ||
			board.GetTile(0, 0) == X_mark && board.GetTile(1, 0) == X_mark && board.GetTile(2, 0) == X_mark ||
			board.GetTile(0, 1) == X_mark && board.GetTile(1, 1) == X_mark && board.GetTile(2, 1) == X_mark ||
			board.GetTile(0, 2) == X_mark && board.GetTile(1, 2) == X_mark && board.GetTile(2, 2) == X_mark ||
			board.GetTile(0, 0) == X_mark && board.GetTile(1, 1) == X_mark && board.GetTile(2, 2) == X_mark ||
			board.GetTile(0, 2) == X_mark && board.GetTile(1, 1) == X_mark && board.GetTile(2, 0) == X_mark)
			DeclareWinner(0);
		else if (board.GetTile(0, 0) == O_mark && board.GetTile(0, 1) == O_mark && board.GetTile(0, 2) == O_mark ||
			board.GetTile(1, 0) == O_mark && board.GetTile(1, 1) == O_mark && board.GetTile(1, 2) == O_mark ||
			board.GetTile(2, 0) == O_mark && board.GetTile(2, 1) == O_mark && board.GetTile(2, 2) == O_mark ||
			board.GetTile(0, 0) == O_mark && board.GetTile(1, 0) == O_mark && board.GetTile(2, 0) == O_mark ||
			board.GetTile(0, 1) == O_mark && board.GetTile(1, 1) == O_mark && board.GetTile(2, 1) == O_mark ||
			board.GetTile(0, 2) == O_mark && board.GetTile(1, 2) == O_mark && board.GetTile(2, 2) == O_mark ||
			board.GetTile(0, 0) == O_mark && board.GetTile(1, 1) == O_mark && board.GetTile(2, 2) == O_mark ||
			board.GetTile(0, 2) == O_mark && board.GetTile(1, 1) == O_mark && board.GetTile(2, 0) == O_mark)
			DeclareWinner(1);
		else if (board.GetTurns(true, 0) == 4 && board.GetTurns(true, 1) == 4 && board.GetTurns(true, 2) == 4 && 
			board.GetTurns(true, 3) == 4 && board.GetTurns(true, 4) == 4 && board.GetTurns(true, 5) == 4 && 
			board.GetTurns(true, 6) == 4 && board.GetTurns(true, 7) == 4 && board.GetTurns(false, 0) == 4 && 
			board.GetTurns(false, 1) == 4 && board.GetTurns(false, 2) == 4 && board.GetTurns(false, 3) == 4 && 
			board.GetTurns(false, 4) == 4 && board.GetTurns(false, 5) == 4 && board.GetTurns(false, 6) == 4 && 
			board.GetTurns(false, 7) == 4)
			DeclareWinner(2);
		else
			return false; //no winner, keep going

		return true; //after declaring a winner it returns true to end the round
	}
	bool Menu()
	{
		char choice; //at the end of each round player has the choice to...
		cout << "\n'Q' to quit,"; //quit the program
		cout << "\n'N' to start new game,"; //choose new players for a new game
		cout << "\n'C' to continue"; //continue current game, starting a new round
		cout << "\n\t\tChoose one: ";
		cin >> choice;

		switch (toupper(choice))
		{
		case 'Q':
			exit(0);
			break;
		case 'N':
			return false;
			break;
		case 'C':
			return true;
			break;
		}
	}
};

/////////////////////////////////////////////////////////////////
//Function Prototypes
void PlayTTT(TicTacToe);

/////////////////////////////////////////////////////////////////
//Main
int main()
{
	TicTacToe game;
	PlayTTT(game);

	return 0;
}

/////////////////////////////////////////////////////////////////
//Function Definitions
void PlayTTT(TicTacToe game)
{
	bool new_game = true;

	while (true)
	{
		if (new_game)
			game.BeginGame();

		cin.get(); //for whatever reason this is important, keeps the program from crashing
		game.StartRound();
		system("pause");
		do
		{
			game.Player_Turn();

		} while (!game.CheckWinner());

		new_game = !game.Menu();
	}
}
